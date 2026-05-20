// C-321 CommentList — v0.2 B-02
// 본인 댓글 삭제 UI 연결 전용 클라이언트 래퍼. 서버에서 받은 댓글 배열을 그대로 렌더하되,
// 본인 댓글에 한해 onDelete 핸들러를 전달한다. 삭제는 ConfirmDialog → deleteComment → router.refresh.
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CommentItem } from '@/components/post/CommentItem';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { deleteComment, type CommentItem as CommentItemType } from '@/lib/api/posts';

interface Props {
  comments: CommentItemType[];
  currentUserId: string | null;
}

export function CommentList({ comments, currentUserId }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const onDelete = (id: string) => {
    const supabase = createClient();
    startTransition(async () => {
      try {
        await deleteComment(supabase, id);
        toast.show('댓글을 삭제했어요', 'success');
        router.refresh();
      } catch {
        toast.show('삭제에 실패했어요', 'error');
      } finally {
        setPendingId(null);
      }
    });
  };

  if (comments.length === 0) {
    return (
      <Card>
        <EmptyState title="첫 댓글을 남겨보세요" />
      </Card>
    );
  }

  return (
    <>
      <Card>
        {comments.map((c) => {
          const mine = !!currentUserId && currentUserId === c.created_by;
          return (
            <CommentItem
              key={c.id}
              comment={c}
              isMine={mine}
              onDelete={mine ? () => setPendingId(c.id) : undefined}
            />
          );
        })}
      </Card>
      <ConfirmDialog
        open={pendingId !== null}
        title="댓글을 삭제하시겠어요?"
        message="삭제 후 복구할 수 없습니다."
        confirmLabel="삭제"
        danger
        onConfirm={() => {
          if (pendingId) onDelete(pendingId);
        }}
        onCancel={() => setPendingId(null)}
      />
    </>
  );
}
