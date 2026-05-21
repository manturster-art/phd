'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import { deletePost } from '@/lib/api/posts';
import { useToast } from '@/components/ui/Toast';

interface Props {
  postId: string;
  /** 본인 또는 관리자만 수정 가능 */
  canEdit?: boolean;
}

export function PostMenu({ postId, canEdit = false }: Props) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const onDelete = () => {
    const supabase = createClient();
    startTransition(async () => {
      try {
        await deletePost(supabase, postId);
        toast.show('삭제했어요', 'success');
        router.replace('/board');
        router.refresh();
      } catch {
        toast.show('삭제에 실패했어요', 'error');
      } finally {
        setConfirm(false);
      }
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="메뉴"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-bg"
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-sticky min-w-32 rounded-lg border border-border bg-surface py-1">
          {canEdit && (
            <Link
              href={`/board/${postId}/edit`}
              className="block px-3 py-2 text-sm hover:bg-bg"
              onClick={() => setOpen(false)}
            >
              수정
            </Link>
          )}
          <button
            type="button"
            onClick={() => { setOpen(false); setConfirm(true); }}
            className="block w-full px-3 py-2 text-left text-sm text-danger hover:bg-bg"
          >
            삭제
          </button>
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        title="게시글을 삭제하시겠어요?"
        message="삭제 후 복구할 수 없습니다."
        confirmLabel={pending ? '삭제 중...' : '삭제'}
        danger
        onConfirm={onDelete}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
