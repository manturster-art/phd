// POST /api/dues/admin/transactions/commit
// 자동매칭으로 분류된 행만 받아 dues_payment 일괄 갱신 + dues_match_log INSERT.
// 06_backend §4.6 / §4.8 (v0.4: 충돌 처리 정책).
//
// 부분 실패 정책: row별 try/catch (전체 롤백은 단일 RPC 도입 시 검토).
//
// v0.4 변경 (QA P0-1 픽스, PM 결정):
//   - 갱신 전 현재 status / reported_amount 를 SELECT 하여 충돌 검사.
//   - status 가 'unpaid' / 'pending_payment' 가 아니면 skip.
//   - status 가 'pending_payment' 인 경우 CSV 금액 == reported_amount 일 때만 paid 전이.
//   - 부분/초과 납부 (amount_mismatch) 행은 클라이언트가 commit 에 포함시키지 않는 게 정상이나,
//     포함되더라도 status 검사 단계에서 자연스럽게 skip 처리된다.
//   - 멱등성: 이미 paid 인 row 는 두 번째 commit 시도 시에도 skip ('already_paid').
//
// 응답 스키마 (v0.4):
//   {
//     confirmed: number,
//     skipped: Array<{ paymentId: string; reason: DuesCommitSkipReason; detail?: string }>,
//     // 하위 호환을 위해 기존 필드도 유지:
//     ok: number, failed: number, failures: Array<{ paymentId, reason }>
//   }
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';
import { isDemoMode } from '@/lib/dues/demo-mode';
import type { DuesCommitSkipReason } from '@/lib/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// match_type: amount_mismatch 는 클라이언트가 보내면 안 되지만 방어적으로 schema 에는 포함.
//             commit 단계에서는 status 검사로 어차피 skip 된다.
const rowSchema = z.object({
  matchType: z.enum([
    'auto_exact',
    'auto_pattern',
    'auto_oldest',
    'manual',
    'amount_mismatch',
  ]),
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

type SkipEntry = {
  paymentId: string;
  reason: DuesCommitSkipReason;
  detail?: string;
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const rows = parsed.data.rows;

  if (isDemoMode()) {
    return NextResponse.json({
      confirmed: rows.length,
      skipped: [] as SkipEntry[],
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

  let confirmed = 0;
  const skipped: SkipEntry[] = [];

  for (const r of rows) {
    try {
      // 0) 클라이언트가 amount_mismatch 를 commit 에 넣어 보낸 경우 — 즉시 skip.
      if (r.matchType === 'amount_mismatch') {
        skipped.push({
          paymentId: r.paymentId,
          reason: 'amount_mismatch',
          detail: '항목 금액과 입금액이 달라 자동 확정 대상에서 제외되었어요.',
        });
        continue;
      }

      // 1) 현재 payment row SELECT — 상태/신고금액 검증 (P0-1 픽스).
      const { data: current, error: selErr } = await supabase
        .from('dues_payment')
        .select('id, status, reported_amount, member_id')
        .eq('id', r.paymentId)
        .maybeSingle();
      if (selErr) {
        skipped.push({
          paymentId: r.paymentId,
          reason: 'update_failed',
          detail: selErr.message,
        });
        continue;
      }
      const cur = current as {
        id: string;
        status: string;
        reported_amount: number | null;
        member_id: string;
      } | null;
      if (!cur) {
        skipped.push({
          paymentId: r.paymentId,
          reason: 'not_found',
          detail: '해당 회비 항목을 찾지 못했어요.',
        });
        continue;
      }

      // 2) 상태 검사 — 'unpaid' / 'pending_payment' 만 진행.
      if (cur.status === 'paid') {
        skipped.push({
          paymentId: r.paymentId,
          reason: 'already_paid',
          detail: '이미 납부 처리됨',
        });
        continue;
      }
      if (cur.status !== 'unpaid' && cur.status !== 'pending_payment') {
        skipped.push({
          paymentId: r.paymentId,
          reason: 'invalid_status',
          detail: `현재 상태(${cur.status})에서는 자동 확정 대상이 아닙니다.`,
        });
        continue;
      }

      // 3) pending_payment 인 경우 — 회원 신고 금액과 CSV 금액 일치 필요.
      if (cur.status === 'pending_payment') {
        if (
          cur.reported_amount == null ||
          cur.reported_amount !== r.raw.amount
        ) {
          skipped.push({
            paymentId: r.paymentId,
            reason: 'pending_mismatch',
            detail: `회원 신고 금액(${cur.reported_amount ?? '없음'})과 CSV 금액(${r.raw.amount})이 일치하지 않습니다. 컨펌 화면에서 확인해주세요.`,
          });
          continue;
        }
      }

      // 4) 거래일 → ISO timestamptz.
      let paidAt: string;
      const d = new Date(r.raw.transactionDate);
      if (!Number.isNaN(d.getTime())) {
        paidAt = d.toISOString();
      } else {
        paidAt = `${r.raw.transactionDate}T00:00:00.000Z`;
      }
      const memoPrefix = r.raw.memo ? `[CSV] ${r.raw.memo}` : null;

      // 5) dues_payment 갱신 — 동시성 보호: status 가 여전히 동일할 때만 갱신.
      //    (다른 임원이 동시에 paid 로 바꿨다면 매칭된 행 0개 → skip.)
      const updatePayload: Record<string, unknown> = {
        status: 'paid',
        paid_at: paidAt,
        paid_amount_krw: r.raw.amount,
        match_source: 'csv_upload',
        updated_by: officerId,
      };
      if (memoPrefix !== null) {
        updatePayload.memo = memoPrefix;
      }

      const { data: updated, error: updErr } = await (
        supabase.from('dues_payment') as any
      )
        .update(updatePayload)
        .eq('id', r.paymentId)
        .eq('status', cur.status) // optimistic concurrency
        .select('id')
        .maybeSingle();
      if (updErr) {
        skipped.push({
          paymentId: r.paymentId,
          reason: 'update_failed',
          detail: updErr.message,
        });
        continue;
      }
      if (!updated) {
        // 동시에 다른 흐름이 status 를 바꿨음.
        skipped.push({
          paymentId: r.paymentId,
          reason: 'invalid_status',
          detail: '갱신 직전 다른 흐름이 상태를 변경했어요. 다시 확인해주세요.',
        });
        continue;
      }

      // 6) dues_match_log INSERT — 'amount_mismatch' 매칭 타입은 위 0번에서 걸러졌으므로
      //    여기 도달하는 matchType 은 항상 DB 허용 라벨.
      const { error: logErr } = await (
        supabase.from('dues_match_log') as any
      ).insert({
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
        // log 실패는 확정 자체는 성공한 뒤 발생 — best-effort 로 처리하되 skip 으로 보고.
        skipped.push({
          paymentId: r.paymentId,
          reason: 'update_failed',
          detail: `매칭 로그 기록 실패: ${logErr.message}`,
        });
        continue;
      }

      // 7) 알림 — best-effort.
      await (supabase.from('notifications') as any)
        .insert({
          recipient_id: cur.member_id,
          kind: 'dues_status_changed',
          title: '회비 입금이 확인되었습니다',
          body: '거래내역 일괄 확정으로 납부 처리되었어요.',
          dues_payment_id: r.paymentId,
        })
        .then(() => undefined, () => undefined);

      confirmed += 1;
    } catch (e: unknown) {
      skipped.push({
        paymentId: r.paymentId,
        reason: 'update_failed',
        detail: e instanceof Error ? e.message : 'unknown',
      });
    }
  }

  // 하위 호환 필드 (ok/failed/failures) 동시 노출 — Frontend 가 점진 마이그레이션.
  const failed = skipped.length;
  return NextResponse.json({
    confirmed,
    skipped,
    ok: confirmed,
    failed,
    failures: skipped.map((s) => ({
      paymentId: s.paymentId,
      reason: s.detail ?? s.reason,
    })),
  });
}
