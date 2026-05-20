// C-101 TextField — Apple 그래머: 18px 라운드 박스. focus 시 2px Action Blue 링.
// 검색용 pill 변형은 search prop 으로 선택.
'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  rightSlot?: ReactNode;
  /** true 면 pill (검색/필터 등). 기본은 18px 라운드 폼 필드. */
  search?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, rightSlot, id, className, required, search, ...rest },
  ref
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-normal text-text-secondary"
        >
          {label}
          {required && (
            <span className="ml-1 text-danger" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      <div
        className={cn(
          'flex h-11 items-center bg-surface px-4',
          search ? 'rounded-pill' : 'rounded-lg',
          'border focus-within:shadow-focus',
          error ? 'border-danger' : 'border-border'
        )}
      >
        <input
          ref={ref}
          id={inputId}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            'flex-1 bg-transparent text-base text-text-primary placeholder:text-text-muted outline-none',
            className
          )}
          {...rest}
        />
        {rightSlot && <div className="ml-2 flex items-center">{rightSlot}</div>}
      </div>
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-err`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
