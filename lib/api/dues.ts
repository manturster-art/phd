import type { TypedSupabaseClient } from '@/lib/supabase/types';
import type { DuesStatus, ProfileStatus } from '@/lib/types/database';

export interface DuesTermItem {
  id: string;
  label: string;
  amount_krw: number;
  due_date: string | null;
  description_md: string | null;
  created_at: string;
}

export interface MyDuesRow {
  id: string;
  status: DuesStatus;
  paid_at: string | null;
  // v0.2: dues_payment_member_view 에서 조회. memo_public=false 이면 NULL 마스킹.
  memo: string | null;
  memo_public: boolean;
  updated_at: string;
  dues_term: {
    id: string;
    label: string;
    amount_krw: number;
    due_date: string | null;
    description_md: string | null;
  } | null;
}

export interface DuesMatrixRow {
  id: string;
  status: DuesStatus;
  memo: string | null;
  // v0.2: 임원이 "회원에게 메모 공개" 토글 가능.
  memo_public: boolean;
  paid_at: string | null;
  member: {
    id: string;
    name: string;
    cohort_year: number | null;
    lab: string | null;
    phone: string | null;
  } | null;
}

export interface UnpaidMember {
  member_id: string;
  name: string;
  cohort_year: number | null;
  lab: string | null;
  phone: string | null;
  // v0.2: 활동 회원과 정지/탈퇴/반려 회원을 UI에서 섹션 분리하기 위한 필드.
  member_status: ProfileStatus;
  status: DuesStatus;
  memo: string | null;
  memo_public: boolean;
  updated_at: string;
}

export async function listDuesTerms(
  supabase: TypedSupabaseClient
): Promise<DuesTermItem[]> {
  const { data, error } = await supabase
    .from('dues_term')
    .select('id, label, amount_krw, due_date, description_md, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DuesTermItem[];
}

export async function getDuesTerm(
  supabase: TypedSupabaseClient,
  id: string
): Promise<DuesTermItem | null> {
  const { data, error } = await supabase
    .from('dues_term')
    .select('id, label, amount_krw, due_date, description_md, created_at')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return (data as DuesTermItem | null) ?? null;
}

export interface CreateDuesTermInput {
  label: string;
  amount_krw: number;
  due_date?: string | null;
  description_md?: string | null;
}

export async function createDuesTerm(
  supabase: TypedSupabaseClient,
  input: CreateDuesTermInput,
  authorId: string
): Promise<string> {
  const { data, error } = await (supabase.from('dues_term') as any)
    .insert({ ...input, created_by: authorId })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateDuesTerm(
  supabase: TypedSupabaseClient,
  id: string,
  input: Partial<CreateDuesTermInput>
) {
  const { error } = await (supabase.from('dues_term') as any).update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteDuesTerm(
  supabase: TypedSupabaseClient,
  id: string
) {
  const { error } = await (supabase.from('dues_term') as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function listMyDues(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<MyDuesRow[]> {
  // v0.2 B-03: dues_payment 직접 조회 대신 dues_payment_member_view 사용.
  // 뷰가 memo_public=false 인 행의 memo 를 NULL 로 마스킹한다.
  const { data, error } = await (supabase as any)
    .from('dues_payment_member_view')
    .select(
      'id, status, paid_at, memo, memo_public, updated_at, dues_term:dues_term_id(id, label, amount_krw, due_date, description_md)'
    )
    .eq('member_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MyDuesRow[];
}

export async function listDuesMatrix(
  supabase: TypedSupabaseClient,
  termId: string
): Promise<DuesMatrixRow[]> {
  const { data, error } = await supabase
    .from('dues_payment')
    .select(
      'id, status, memo, memo_public, paid_at, member:profiles!member_id(id, name, cohort_year, lab, phone)'
    )
    .eq('dues_term_id', termId)
    .order('member(cohort_year)', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as DuesMatrixRow[];
}

export async function listUnpaid(
  supabase: TypedSupabaseClient,
  termId: string,
  includeInactive: boolean = true
): Promise<UnpaidMember[]> {
  // v0.2 B-04: p_include_inactive 추가. 기본 true (정지/탈퇴/반려 회원 미납도 포함).
  const { data, error } = await (supabase as any).rpc('list_dues_unpaid', {
    p_dues_term_id: termId,
    p_include_inactive: includeInactive,
  });
  if (error) throw error;
  return (data ?? []) as UnpaidMember[];
}

export interface UpdateDuesPaymentInput {
  status: DuesStatus;
  memo?: string | null;
  // v0.2 B-03: 임원이 "회원에게 메모 공개" 토글 시 전송.
  memo_public?: boolean;
  paid_at?: string | null;
}

export async function updateDuesPayment(
  supabase: TypedSupabaseClient,
  id: string,
  input: UpdateDuesPaymentInput,
  officerId: string
) {
  const payload: Record<string, unknown> = {
    status: input.status,
    memo: input.memo ?? null,
    paid_at:
      input.paid_at ??
      (input.status === 'paid' ? new Date().toISOString() : null),
    updated_by: officerId,
  };
  // memo_public 은 undefined 일 때 미전송(서버 기본값/기존값 유지).
  if (input.memo_public !== undefined) {
    payload.memo_public = input.memo_public;
  }
  const { error } = await (supabase.from('dues_payment') as any)
    .update(payload)
    .eq('id', id);
  if (error) throw error;
}
