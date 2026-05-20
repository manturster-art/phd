// C-320 CommentItem
import { formatRelative } from '@/lib/utils/format';
import type { CommentItem as CommentItemType } from '@/lib/api/posts';

interface Props {
  comment: CommentItemType;
  isMine?: boolean;
  onDelete?: () => void;
}

export function CommentItem({ comment, isMine, onDelete }: Props) {
  return (
    <div className="border-b border-border px-4 py-3 last:border-b-0">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text-primary">
          {comment.author?.name ?? '(탈퇴회원)'}
          <span className="ml-2 font-normal text-text-secondary">
            {formatRelative(comment.created_at)}
          </span>
        </p>
        {isMine && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-text-secondary hover:text-danger"
          >
            삭제
          </button>
        )}
      </div>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-text-primary">
        {comment.body_md}
      </p>
    </div>
  );
}
