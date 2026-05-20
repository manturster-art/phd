// C-190 Skeleton — Apple 그래머: parchment 톤. 카드 라운드 18px.
import { cn } from '@/lib/utils/cn';

interface Props {
  className?: string;
  shape?: 'line' | 'card' | 'avatar';
}

export function Skeleton({ className, shape = 'line' }: Props) {
  const base = 'animate-pulse bg-bg';
  const shapeClass =
    shape === 'avatar'
      ? 'h-10 w-10 rounded-full'
      : shape === 'card'
      ? 'h-24 w-full rounded-lg'
      : 'h-4 w-full rounded-sm';
  return <div className={cn(base, shapeClass, className)} />;
}
