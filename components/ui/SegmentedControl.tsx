// C-140 SegmentedControl
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
        'inline-flex w-full rounded-md border border-border bg-bg-subtle p-1',
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
              'min-h-[44px] flex-1 rounded-md px-3 text-sm font-medium transition-colors',
              active
                ? 'bg-surface text-text-primary shadow-sm'
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
