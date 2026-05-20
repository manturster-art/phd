import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types/database';

// 현재 로그인된 사용자의 profile을 반환. 없으면 null.
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

export function isOfficer(profile: Profile | null): boolean {
  return !!profile && profile.status === 'active' && (profile.role === 'officer' || profile.role === 'admin');
}

export function isAdmin(profile: Profile | null): boolean {
  return !!profile && profile.status === 'active' && profile.role === 'admin';
}
