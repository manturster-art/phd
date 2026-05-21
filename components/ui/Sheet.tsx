// C-170 BottomSheet — Apple 그래머: 상단 라운드 18px, 표면 흰색, 그림자 없음.
// 백드롭은 black/40 유지 (Apple 의 modal 백드롭과 유사).
'use client';

import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  // QA P1-2: 포커스가 시트 내부에 갇히도록 trap. ESC 처리는 그대로 유지.
  const trapRef = useFocusTrap<HTMLDivElement>(open);

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
        ref={trapRef}
        className={cn(
          'w-full max-w-app bg-surface p-6',
          'rounded-t-lg border-t border-x border-border',
          'animate-[slideUp_200ms_ease-out]'
        )}
        style={{ paddingBottom: `calc(24px + var(--sab, 0px))` }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-4 text-lg font-semibold text-text-primary">
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
