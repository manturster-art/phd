// SCR-032 게시글 수정 — 본인 또는 관리자만 진입 가능
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPost } from '@/lib/api/posts';
import { getCurrentProfile, isAdmin } from '@/lib/utils/auth';
import { PostEditor } from '../../new/PostEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: '게시글 수정 · 원우회' };

export default async function PostEditPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const supabase = createClient();
  const post = await getPost(supabase, params.id);
  if (!post) notFound();

  const isMine = profile.id === post.created_by;
  // 본인 + 관리자만 진입. 그 외에는 상세로 돌려보낸다.
  if (!isMine && !isAdmin(profile)) {
    redirect(`/board/${post.id}`);
  }

  return (
    <PostEditor
      mode="edit"
      postId={post.id}
      initial={{ title: post.title, body_md: post.body_md }}
    />
  );
}
