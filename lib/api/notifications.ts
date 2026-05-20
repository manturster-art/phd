import type { TypedSupabaseClient } from '@/lib/supabase/types';
import type { Notification } from '@/lib/types/database';

export async function listNotifications(
  supabase: TypedSupabaseClient,
  limit = 50
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function countUnread(
  supabase: TypedSupabaseClient
): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);
  if (error) throw error;
  return count ?? 0;
}

export async function markRead(
  supabase: TypedSupabaseClient,
  id: string
) {
  const { error } = await (supabase.from('notifications') as any)
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllRead(supabase: TypedSupabaseClient) {
  const { error } = await (supabase as any).rpc('mark_all_notifications_read');
  if (error) throw error;
}
