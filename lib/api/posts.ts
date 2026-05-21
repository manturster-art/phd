import type { TypedSupabaseClient } from '@/lib/supabase/types';
import type { PostCategory } from '@/lib/types/database';

export interface PostListItem {
  id: string;
  title: string;
  body_md: string;
  category: PostCategory;
  comment_count: number;
  created_at: string;
  is_hidden: boolean;
  author: { name: string } | null;
}

export interface PostDetail extends PostListItem {
  updated_at: string;
  created_by: string | null;
  author: { name: string; role: string; cohort_year: number | null } | null;
}

export interface CommentItem {
  id: string;
  body_md: string;
  parent_id: string | null;
  created_at: string;
  created_by: string | null;
  author: { name: string } | null;
}

const SELECT_LIST = 'id, title, body_md, category, comment_count, created_at, is_hidden, author:profiles!created_by(name)';
const SELECT_DETAIL = 'id, title, body_md, category, comment_count, created_at, updated_at, is_hidden, created_by, author:profiles!created_by(name, role, cohort_year)';

export async function listPosts(
  supabase: TypedSupabaseClient,
  limit = 20
): Promise<PostListItem[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(SELECT_LIST)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as PostListItem[];
}

export async function getPost(
  supabase: TypedSupabaseClient,
  id: string
): Promise<PostDetail | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(SELECT_DETAIL)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as PostDetail | null) ?? null;
}

export interface CreatePostInput {
  title: string;
  body_md: string;
  category?: PostCategory;
}

export async function createPost(
  supabase: TypedSupabaseClient,
  input: CreatePostInput,
  authorId: string
): Promise<string> {
  const { data, error } = await (supabase.from('posts') as any)
    .insert({ ...input, created_by: authorId })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updatePost(
  supabase: TypedSupabaseClient,
  id: string,
  input: Partial<CreatePostInput>
) {
  const { error } = await (supabase.from('posts') as any).update(input).eq('id', id);
  if (error) throw error;
}

export async function deletePost(
  supabase: TypedSupabaseClient,
  id: string
) {
  const { error } = await (supabase.from('posts') as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function listComments(
  supabase: TypedSupabaseClient,
  postId: string
): Promise<CommentItem[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('id, body_md, parent_id, created_at, created_by, author:profiles!created_by(name)')
    .eq('post_id', postId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as CommentItem[];
}

export async function createComment(
  supabase: TypedSupabaseClient,
  postId: string,
  body_md: string,
  authorId: string,
  parentId?: string | null
) {
  const { error } = await (supabase.from('comments') as any).insert({
    post_id: postId,
    body_md,
    created_by: authorId,
    parent_id: parentId ?? null,
  });
  if (error) throw error;
}

export async function deleteComment(
  supabase: TypedSupabaseClient,
  id: string
) {
  const { error } = await (supabase.from('comments') as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
