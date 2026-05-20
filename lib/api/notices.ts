import type { TypedSupabaseClient } from '@/lib/supabase/types';
import type { UserRole } from '@/lib/types/database';

export type NoticeAuthor = { name: string; role: UserRole } | null;

export interface NoticeListItem {
  id: string;
  title: string;
  body_md: string;
  pinned: boolean;
  created_at: string;
  author: NoticeAuthor;
}

export interface NoticeDetail extends NoticeListItem {
  updated_at: string;
  created_by: string | null;
}

const SELECT_LIST = 'id, title, body_md, pinned, created_at, author:profiles!created_by(name, role)';
const SELECT_DETAIL = 'id, title, body_md, pinned, created_at, updated_at, created_by, author:profiles!created_by(name, role)';

export async function listNotices(
  supabase: TypedSupabaseClient,
  limit = 20
): Promise<NoticeListItem[]> {
  const { data, error } = await supabase
    .from('notices')
    .select(SELECT_LIST)
    .is('deleted_at', null)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as NoticeListItem[];
}

export async function getNotice(
  supabase: TypedSupabaseClient,
  id: string
): Promise<NoticeDetail | null> {
  const { data, error } = await supabase
    .from('notices')
    .select(SELECT_DETAIL)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as NoticeDetail | null) ?? null;
}

export interface CreateNoticeInput {
  title: string;
  body_md: string;
  pinned?: boolean;
}

export async function createNotice(
  supabase: TypedSupabaseClient,
  input: CreateNoticeInput,
  authorId: string
): Promise<string> {
  // 수동 작성 Database 타입과 supabase-js v2.106 제네릭 정합 문제로 .insert/.update 캐스트.
  const { data, error } = await (supabase.from('notices') as any)
    .insert({ ...input, created_by: authorId })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateNotice(
  supabase: TypedSupabaseClient,
  id: string,
  input: Partial<CreateNoticeInput>
) {
  const { error } = await (supabase.from('notices') as any).update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteNotice(
  supabase: TypedSupabaseClient,
  id: string
) {
  const { error } = await (supabase.from('notices') as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
