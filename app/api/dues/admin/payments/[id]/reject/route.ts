// POST /api/dues/admin/payments/[id]/reject
// 임원이 입금 신고를 반려 (pending_payment → rejected).
// 백엔드 명세 06_backend §4.4. 사유 1~200자 필수.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';
import { isDemoMode } from '@/lib/dues/demo-mode';

export const runtime = 'nodejs';

const bodySchema = z.object({ reason: z.string().min(1).max(200) });
const paramSchema = z.object({ id: z.string().uuid() });

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ip = paramSchema.safeParse(params);
  if (!ip.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const bp = bodySchema.safeParse(body);
  if (!bp.success) {
    return NextResponse.json({ error: 'reason_required' }, { status: 400 });
  }
  const id = ip.data.id;
  const reason = bp.data.reason;

  if (isDemoMode()) {
    return NextResponse.json({
      id,
      status: 'rejected',
      rejection_reason: reason,
      demo: true,
    });
  }

  const profile = await getCurrentProfile();
  if (!isOfficer(profile)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = createClient();
  const { data: current, error: selErr } = await supabase
    .from('dues_payment')
    .select('id, status, member_id')
    .eq('id', id)
    .maybeSingle();
  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 });
  }
  if (!current) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const row = current as unknown as { id: string; status: string; member_id: string };
  if (row.status !== 'pending_payment') {
    return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });
  }

  const { error: updErr } = await (supabase.from('dues_payment') as any)
    .update({
      status: 'rejected',
      rejection_reason: reason,
      updated_by: profile!.id,
    })
    .eq('id', id);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  await (supabase.from('notifications') as any)
    .insert({
      recipient_id: row.member_id,
      kind: 'dues_status_changed',
      title: '회비 입금 신고가 반려되었습니다',
      body: `사유: ${reason}`,
      dues_payment_id: row.id,
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({
    id: row.id,
    status: 'rejected',
    rejection_reason: reason,
  });
}
