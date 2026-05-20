// POST /api/dues/[id]/report
// 회원이 본인 회비 항목에 입금 신고 (unpaid → pending_payment).
// 06_backend §4.1. Frontend가 직접 supabase update 를 호출해도 되지만, 일관된
// 에러 응답과 데모 모드 모킹을 위해 Route Handler 를 둔다.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/dues/demo-mode';

export const runtime = 'nodejs';

const bodySchema = z.object({
  reportedAt: z.string().min(1),
  reportedAmount: z.number().int().nonnegative(),
  reportedMemo: z.string().max(200).nullable().optional(),
});

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
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const id = ip.data.id;
  const input = bp.data;

  if (isDemoMode()) {
    return NextResponse.json({
      id,
      status: 'pending_payment',
      reported_at: input.reportedAt,
      reported_amount: input.reportedAmount,
      reported_memo: input.reportedMemo ?? null,
      demo: true,
    });
  }

  const supabase = createClient();
  // RLS + 가드 트리거 로 본인 행 + unpaid → pending_payment 만 허용된다.
  const { data, error } = await (supabase.from('dues_payment') as any)
    .update({
      status: 'pending_payment',
      reported_at: input.reportedAt,
      reported_amount: input.reportedAmount,
      reported_memo: input.reportedMemo ?? null,
    })
    .eq('id', id)
    .select('id, status, reported_at, reported_amount, reported_memo')
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json(data);
}
