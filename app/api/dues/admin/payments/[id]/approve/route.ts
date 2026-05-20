// POST /api/dues/admin/payments/[id]/approve
// 임원이 회원의 입금 신고를 컨펌 (pending_payment → paid).
// 백엔드 명세 06_backend §4.3.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';
import { isDemoMode } from '@/lib/dues/demo-mode';

export const runtime = 'nodejs';

const paramSchema = z.object({ id: z.string().uuid() });

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  // 입력 검증
  const parsed = paramSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }
  const id = parsed.data.id;

  // 데모 모드: 인증/DB 건너뛰고 성공 응답만.
  if (isDemoMode()) {
    return NextResponse.json({
      id,
      status: 'paid',
      paid_at: new Date().toISOString(),
      demo: true,
    });
  }

  const profile = await getCurrentProfile();
  if (!isOfficer(profile)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = createClient();
  // 현재 상태 조회
  const { data: current, error: selErr } = await supabase
    .from('dues_payment')
    .select('id, status, reported_at, reported_amount, member_id')
    .eq('id', id)
    .maybeSingle();
  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 });
  }
  if (!current) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  type Row = {
    id: string;
    status: string;
    reported_at: string | null;
    reported_amount: number | null;
    member_id: string;
  };
  const row = current as unknown as Row;
  if (row.status === 'paid') {
    return NextResponse.json({ id: row.id, status: 'paid', already: true });
  }
  if (row.status !== 'pending_payment') {
    return NextResponse.json(
      { error: 'invalid_transition' },
      { status: 409 }
    );
  }

  const paid_at = row.reported_at ?? new Date().toISOString();
  const { error: updErr } = await (supabase.from('dues_payment') as any)
    .update({
      status: 'paid',
      paid_at,
      paid_amount_krw: row.reported_amount,
      match_source: 'member_report',
      updated_by: profile!.id,
    })
    .eq('id', id);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // 알림 (best-effort)
  await (supabase.from('notifications') as any)
    .insert({
      recipient_id: row.member_id,
      kind: 'dues_status_changed',
      title: '회비 입금이 확인되었습니다',
      body: '신고하신 입금이 임원에 의해 컨펌되었어요.',
      dues_payment_id: row.id,
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ id: row.id, status: 'paid', paid_at });
}
