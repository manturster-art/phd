// C-230 InfoBanner — Apple 그래머:
// parchment 배경 + ink 텍스트 + 좌측 Action Blue 1px 라인 (info).
// warning 톤도 동일 chassis 에 채도 낮은 amber 라인.
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface Props {
  tone?: 'info' | 'warning';
  children: ReactNode;
  className?: string;
}

export function InfoBanner({ tone = 'info', children, className }: Props) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-bg px-4 py-3 text-sm text-text-primary',
        'border-l-[3px]',
        tone === 'warning'
          ? 'border-warning border-l-warning'
          : 'border-border border-l-primary-500',
        className
      )}
    >
      {children}
    </div>
  );
}
