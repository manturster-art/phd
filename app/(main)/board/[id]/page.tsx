// SCR-031 게시글 상세
import { notFound } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { createClient } from '@/lib/supabase/server';
import { getPost, listComments } from '@/lib/api/posts';
import { CommentList } from '@/components/post/CommentList';
import { CommentComposer } from '@/components/post/CommentComposer';
import { PostMenu } from './PostMenu';
import { getCurrentProfile, isAdmin } from '@/lib/utils/auth';
import { formatDateTime } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  const [post, comments] = await Promise.all([
    getPost(supabase, params.id),
    listComments(supabase, params.id).catch(() => []),
  ]);
  if (!post) notFound();

  const isMine = !!profile && profile.id === post.created_by;
  const adminOverride = isAdmin(profile);
  const showMenu = isMine || adminOverride;
  // 수정은 본인 + 관리자만. (일반 회원은 다른 사람 글 수정 X)
  const canEdit = isMine || adminOverride;

  return (
    <>
      <AppBar
        title="게시글"
        leading="back"
        trailing={showMenu ? <PostMenu postId={post.id} canEdit={canEdit} /> : null}
      />
      <article className="py-5">
        <h1 className="text-xl font-bold leading-tight">{post.title}</h1>
        <p className="mt-2 text-sm text-text-secondary">
          {post.author?.name ?? '(탈퇴회원)'} · {formatDateTime(post.created_at)}
        </p>
        <div className="mt-5 whitespace-pre-wrap break-words text-base leading-relaxed text-text-primary">
          {post.body_md}
        </div>
      </article>

      <section className="pt-4 pb-24">
        <p className="px-1 text-sm font-semibold">💬 댓글 ({post.comment_count})</p>
        <div className="mt-2">
          {/* v0.2 B-02: 본인 댓글 삭제 UI 연결 */}
          <CommentList comments={comments} currentUserId={profile?.id ?? null} />
        </div>
      </section>

      {profile && <CommentComposer postId={post.id} userId={profile.id} />}
    </>
  );
}
