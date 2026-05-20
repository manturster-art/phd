import type { TypedSupabaseClient } from '@/lib/supabase/types';
import type { DuesStatus } from '@/lib/types/database';

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
  memo: string | null;
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
  status: DuesStatus;
  memo: string | null;
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
  const { data, error } = await supabase
    .from('dues_payment')
    .select('id, status, paid_at, memo, updated_at, dues_term:dues_term_id(id, label, amount_krw, due_date, description_md)')
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
    .select('id, status, memo, paid_at, member:profiles!member_id(id, name, cohort_year, lab, phone)')
    .eq('dues_term_id', termId)
    .order('member(cohort_year)', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as DuesMatrixRow[];
}

export async function listUnpaid(
  supabase: TypedSupabaseClient,
  termId: string
): Promise<UnpaidMember[]> {
  const { data, error } = await (supabase as any).rpc('list_dues_unpaid', {
    p_dues_term_id: termId,
  });
  if (error) throw error;
  return (data ?? []) as UnpaidMember[];
}

export interface UpdateDuesPaymentInput {
  status: DuesStatus;
  memo?: string | null;
  paid_at?: string | null;
}

export async function updateDuesPayment(
  supabase: TypedSupabaseClient,
  id: string,
  input: UpdateDuesPaymentInput,
  officerId: string
) {
  const { error } = await (supabase.from('dues_payment') as any)
    .update({
      status: input.status,
      memo: input.memo ?? null,
      paid_at:
        input.paid_at ??
        (input.status === 'paid' ? new Date().toISOString() : null),
      updated_by: officerId,
    })
    .eq('id', id);
  if (error) throw error;
}
