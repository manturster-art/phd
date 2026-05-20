import type { TypedSupabaseClient } from '@/lib/supabase/types';
import type { Profile } from '@/lib/types/database';

export interface PendingMember {
  id: string;
  name: string;
  email: string;
  student_id: string | null;
  cohort_year: number | null;
  lab: string | null;
  phone: string | null;
  created_at: string;
}

export async function listPendingMembers(
  supabase: TypedSupabaseClient
): Promise<PendingMember[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, student_id, cohort_year, lab, phone, created_at')
    .eq('status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as PendingMember[];
}

export async function listActiveMembers(
  supabase: TypedSupabaseClient
): Promise<Pick<Profile, 'id' | 'name' | 'cohort_year' | 'lab' | 'role'>[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, cohort_year, lab, role')
    .eq('status', 'active')
    .eq('is_anonymous_placeholder', false)
    .is('deleted_at', null)
    .order('cohort_year', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Pick<Profile, 'id' | 'name' | 'cohort_year' | 'lab' | 'role'>[];
}

export async function approveMember(
  supabase: TypedSupabaseClient,
  userId: string
) {
  const { error } = await (supabase as any).rpc('approve_membership', { p_user_id: userId });
  if (error) throw error;
}

export async function rejectMember(
  supabase: TypedSupabaseClient,
  userId: string,
  reason: string
) {
  const { error } = await (supabase as any).rpc('reject_membership', {
    p_user_id: userId,
    p_reason: reason,
  });
  if (error) throw error;
}

export async function updateMyProfile(
  supabase: TypedSupabaseClient,
  userId: string,
  input: Partial<Pick<Profile, 'name' | 'lab' | 'phone'>>
) {
  const { error } = await (supabase.from('profiles') as any).update(input).eq('id', userId);
  if (error) throw error;
}
