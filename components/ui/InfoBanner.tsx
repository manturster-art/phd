// C-230 InfoBanner
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
        'rounded-md border px-4 py-3 text-sm',
        tone === 'warning'
          ? 'border-warning/30 bg-warning-bg text-warning'
          : 'border-primary-100 bg-primary-50 text-primary-700',
        className
      )}
    >
      {children}
    </div>
  );
}
