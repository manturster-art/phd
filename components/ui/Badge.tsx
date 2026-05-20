// C-220 StatusPill / C-202 RoleBadge
import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneClass: Record<Tone, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-primary-100 text-primary-700',
  neutral: 'bg-neutral-bg text-text-secondary',
  primary: 'bg-primary-100 text-primary-700',
};

export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        toneClass[tone],
        className
      )}
      {...rest}
    />
  );
}
