'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import { deleteEvent } from '@/lib/api/events';
import { useToast } from '@/components/ui/Toast';

export function EventMenu({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const onDelete = () => {
    const supabase = createClient();
    startTransition(async () => {
      try {
        await deleteEvent(supabase, eventId);
        toast.show('삭제했어요', 'success');
        router.replace('/calendar');
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
        className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-bg-subtle"
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-sticky min-w-32 rounded-md border border-border bg-surface py-1 shadow-md">
          <button
            type="button"
            onClick={() => { setOpen(false); setConfirm(true); }}
            className="block w-full px-3 py-2 text-left text-sm text-danger hover:bg-bg-subtle"
          >
            삭제
          </button>
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        title="일정을 삭제하시겠어요?"
        confirmLabel={pending ? '삭제 중...' : '삭제'}
        danger
        onConfirm={onDelete}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
