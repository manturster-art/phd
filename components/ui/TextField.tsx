// C-101 TextField
'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  rightSlot?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, rightSlot, id, className, required, ...rest },
  ref
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}
          {required && <span className="ml-1 text-danger" aria-hidden>*</span>}
        </label>
      )}
      <div
        className={cn(
          'flex h-11 items-center rounded-md border bg-surface px-3',
          'focus-within:shadow-focus',
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
        <p id={`${inputId}-hint`} className="text-xs text-text-secondary">
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
