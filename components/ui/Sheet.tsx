// C-170 BottomSheet
'use client';

import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-sheet flex items-end justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-app rounded-t-lg bg-surface p-4 shadow-lg',
          'animate-[slideUp_200ms_ease-out]'
        )}
        style={{ paddingBottom: `calc(1rem + var(--sab, 0px))` }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-3 text-base font-semibold text-text-primary">{title}</div>
        )}
        {children}
      </div>
    </div>
  );
}
