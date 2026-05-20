// C-220 StatusPill / C-202 RoleBadge
// Apple 그래머: 풀 pill, 14px caption, 채도 낮은 의미색 표현.
// info/primary 는 모두 Action Blue 컨텍스트로 통합.
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
  // info, primary 모두 Action Blue 와 동일 컨텍스트.
  info: 'bg-primary-100 text-primary-500',
  primary: 'bg-primary-100 text-primary-500',
  neutral: 'bg-bg text-text-secondary',
};

export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-normal',
        toneClass[tone],
        className
      )}
      {...rest}
    />
  );
}
