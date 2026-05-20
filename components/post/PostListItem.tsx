// C-311 PostListItem
import Link from 'next/link';
import { formatRelative } from '@/lib/utils/format';
import type { PostListItem as PostListItemType } from '@/lib/api/posts';

interface Props {
  post: PostListItemType;
}

export function PostListItem({ post }: Props) {
  return (
    <Link
      href={`/board/${post.id}`}
      className="block border-b border-border px-4 py-3 last:border-b-0 hover:bg-bg transition-colors"
    >
      <div className="flex items-start gap-2">
        <h3 className="flex-1 text-sm font-semibold text-text-primary">{post.title}</h3>
        {post.comment_count > 0 && (
          <span className="shrink-0 text-xs text-text-secondary">
            💬 {post.comment_count}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-text-secondary">
        {post.author?.name ?? '(탈퇴회원)'} · {formatRelative(post.created_at)}
      </p>
    </Link>
  );
}
