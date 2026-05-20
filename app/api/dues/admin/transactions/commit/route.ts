// POST /api/dues/admin/transactions/commit
// 자동매칭으로 분류된 행만 받아 dues_payment 일괄 갱신 + dues_match_log INSERT.
// 06_backend §4.6.
//
// 부분 실패 정책: row별 try/catch (전체 롤백은 단일 RPC 도입 시 검토).
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';
import { isDemoMode } from '@/lib/dues/demo-mode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const rowSchema = z.object({
  matchType: z.enum(['auto_exact', 'auto_pattern', 'auto_oldest', 'manual']),
  paymentId: z.string().uuid(),
  sourceBank: z.enum(['kb', 'shinhan', 'woori', 'kakaobank', 'toss', 'unknown']),
  raw: z.object({
    payerName: z.string().min(1).max(60),
    memo: z.string().nullable(),
    amount: z.number().int().nonnegative(),
    transactionDate: z.string(),
  }),
});

const bodySchema = z.object({
  rows: z.array(rowSchema).min(1).max(1000),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const rows = parsed.data.rows;

  if (isDemoMode()) {
    return NextResponse.json({
      ok: rows.length,
      failed: 0,
      failures: [],
      demo: true,
    });
  }

  const profile = await getCurrentProfile();
  if (!isOfficer(profile)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const supabase = createClient();
  const officerId = profile!.id;

  let ok = 0;
  let failed = 0;
  const failures: Array<{ paymentId: string; reason: string }> = [];

  for (const r of rows) {
    try {
      // 거래일 → ISO timestamptz. YYYY-MM-DD 도 허용.
      let paidAt: string;
      const d = new Date(r.raw.transactionDate);
      if (!Number.isNaN(d.getTime())) {
        paidAt = d.toISOString();
      } else {
        paidAt = `${r.raw.transactionDate}T00:00:00.000Z`;
      }
      const memoPrefix = r.raw.memo ? `[CSV] ${r.raw.memo}` : null;

      // 1) dues_payment 갱신
      const { error: updErr } = await (supabase.from('dues_payment') as any)
        .update({
          status: 'paid',
          paid_at: paidAt,
          paid_amount_krw: r.raw.amount,
          memo: memoPrefix ?? undefined,
          match_source: 'csv_upload',
          updated_by: officerId,
        })
        .eq('id', r.paymentId);
      if (updErr) {
        failed += 1;
        failures.push({ paymentId: r.paymentId, reason: updErr.message });
        continue;
      }

      // 2) dues_match_log INSERT
      const { error: logErr } = await (supabase.from('dues_match_log') as any)
        .insert({
          payment_id: r.paymentId,
          raw_payer_name: r.raw.payerName.slice(0, 60),
          raw_memo: r.raw.memo ? r.raw.memo.slice(0, 200) : null,
          raw_amount: r.raw.amount,
          raw_transaction_date: r.raw.transactionDate.slice(0, 10),
          source_bank: r.sourceBank,
          match_type: r.matchType,
          matched_by: officerId,
        });
      if (logErr) {
        failed += 1;
        failures.push({ paymentId: r.paymentId, reason: logErr.message });
        continue;
      }

      // 3) 알림 — best-effort (회원 조회 후)
      const { data: pay } = await supabase
        .from('dues_payment')
        .select('member_id')
        .eq('id', r.paymentId)
        .maybeSingle();
      const memberId = (pay as { member_id: string } | null)?.member_id;
      if (memberId) {
        await (supabase.from('notifications') as any)
          .insert({
            recipient_id: memberId,
            kind: 'dues_status_changed',
            title: '회비 입금이 확인되었습니다',
            body: '거래내역 일괄 확정으로 납부 처리되었어요.',
            dues_payment_id: r.paymentId,
          })
          .then(() => undefined, () => undefined);
      }

      ok += 1;
    } catch (e: unknown) {
      failed += 1;
      failures.push({
        paymentId: r.paymentId,
        reason: e instanceof Error ? e.message : 'unknown',
      });
    }
  }

  return NextResponse.json({ ok, failed, failures });
}
