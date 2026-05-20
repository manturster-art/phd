// SCR-031 데모 — 게시글 상세 + 댓글
import { notFound } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { Card } from '@/components/ui/Card';
import { CommentItem } from '@/components/post/CommentItem';
import { DemoCommentComposer } from '@/components/demo/DemoCommentComposer';
import { getDemoPostDetail, demoComments } from '@/lib/demo/mockData';
import { formatDateTime } from '@/lib/utils/format';

export const metadata = { title: '데모 · 게시글 상세' };

export default function DemoPostDetailPage() {
  const post = getDemoPostDetail('p-1');
  if (!post) notFound();

  return (
    <>
      <AppBar title="게시글" leading="back" />
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
        <p className="px-1 text-sm font-semibold">
          💬 댓글 ({demoComments.length})
        </p>
        <div className="mt-2">
          <Card>
            {demoComments.map((c) => (
              <CommentItem key={c.id} comment={c} />
            ))}
          </Card>
        </div>
      </section>

      <DemoCommentComposer />
    </>
  );
}
