// C-321 CommentComposer (sticky bottom)
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { createComment } from '@/lib/api/posts';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

interface Props {
  postId: string;
  userId: string;
}

export function CommentComposer({ postId, userId }: Props) {
  const [value, setValue] = useState('');
  const [composing, setComposing] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const supabase = createClient();
    startTransition(async () => {
      try {
        await createComment(supabase, postId, trimmed, userId);
        setValue('');
        router.refresh();
      } catch (e) {
        toast.show('댓글 등록에 실패했어요', 'error');
      }
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (composing) return;
        submit();
      }}
      className="sticky bottom-0 z-sticky border-t border-border bg-surface px-4 py-2"
      style={{ paddingBottom: `calc(8px + var(--sab, 0px))` }}
    >
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !composing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="댓글을 입력하세요"
          rows={1}
          maxLength={2000}
          className="flex-1 resize-none rounded-md border border-border bg-surface px-3 py-2 text-base outline-none focus:shadow-focus"
        />
        <Button type="submit" loading={pending} disabled={!value.trim()}>
          등록
        </Button>
      </div>
    </form>
  );
}
