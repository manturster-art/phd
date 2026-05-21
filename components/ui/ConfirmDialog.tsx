// C-171 ConfirmDialog — Apple 그래머: 18px 라운드, hairline 보더, 그림자 없음.
'use client';

import { useEffect } from 'react';
import { Button } from './Button';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface Props {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger,
  onConfirm,
  onCancel,
}: Props) {
  // QA P1-2: 다이얼로그 내부 포커스 trap.
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={trapRef}
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-6"
      >
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        {message && (
          <p className="mt-2 text-sm text-text-secondary">{message}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
