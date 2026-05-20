// 데모 모드 전용 CommentComposer — 실제 등록은 안 하고 alert 만 노출.
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function DemoCommentComposer() {
  const [value, setValue] = useState('');
  const [composing, setComposing] = useState(false);

  const submit = () => {
    if (!value.trim()) return;
    alert('데모 모드입니다 — 댓글은 등록되지 않습니다.');
    setValue('');
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
          placeholder="댓글을 입력하세요 (데모)"
          rows={1}
          maxLength={2000}
          className="flex-1 resize-none rounded-md border border-border bg-surface px-3 py-2 text-base outline-none focus:shadow-focus"
        />
        <Button type="submit" disabled={!value.trim()}>
          등록
        </Button>
      </div>
    </form>
  );
}
