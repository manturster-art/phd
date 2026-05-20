// C-190 Skeleton
import { cn } from '@/lib/utils/cn';

interface Props {
  className?: string;
  shape?: 'line' | 'card' | 'avatar';
}

export function Skeleton({ className, shape = 'line' }: Props) {
  const base = 'animate-pulse bg-bg-subtle';
  const shapeClass =
    shape === 'avatar'
      ? 'h-10 w-10 rounded-full'
      : shape === 'card'
      ? 'h-24 w-full rounded-md'
      : 'h-4 w-full rounded-sm';
  return <div className={cn(base, shapeClass, className)} />;
}
