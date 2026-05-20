// C-140 SegmentedControl — Apple 그래머:
// parchment 트랙 + 활성 칩은 흰색 표면, 활성 텍스트만 Action Blue.
'use client';

import { cn } from '@/lib/utils/cn';

interface Option<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: Props<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex w-full rounded-pill border border-border bg-bg p-1',
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'min-h-[40px] flex-1 rounded-pill px-3 text-sm transition-colors',
              'active:scale-95',
              active
                ? 'bg-surface text-primary-500 font-semibold'
                : 'text-text-secondary'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
