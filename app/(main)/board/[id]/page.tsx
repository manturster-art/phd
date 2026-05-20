// SCR-031 게시글 상세
import { notFound } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { getPost, listComments } from '@/lib/api/posts';
import { CommentItem } from '@/components/post/CommentItem';
import { CommentComposer } from '@/components/post/CommentComposer';
import { PostMenu } from './PostMenu';
import { getCurrentProfile } from '@/lib/utils/auth';
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

  const isMine = profile?.id === post.created_by;

  return (
    <>
      <AppBar
        title="게시글"
        leading="back"
        trailing={isMine ? <PostMenu postId={post.id} /> : null}
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
          {comments.length === 0 ? (
            <Card><EmptyState title="첫 댓글을 남겨보세요" /></Card>
          ) : (
            <Card>
              {comments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  isMine={profile?.id === c.created_by}
                />
              ))}
            </Card>
          )}
        </div>
      </section>

      {profile && <CommentComposer postId={post.id} userId={profile.id} />}
    </>
  );
}
