// C-102 TextArea
'use client';

import { forwardRef, useId, useRef, useState, useEffect, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, id, className, required, rows = 5, ...rest },
  ref
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;

  // IME 조합 중 Enter로 submit 막기 위한 보조 — onKeyDown 핸들러 추가 가능
  const [composing, setComposing] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}
          {required && <span className="ml-1 text-danger" aria-hidden>*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        data-composing={composing || undefined}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={() => setComposing(false)}
        className={cn(
          'w-full rounded-md border bg-surface px-3 py-2 text-base text-text-primary',
          'placeholder:text-text-muted outline-none focus:shadow-focus',
          'resize-y',
          error ? 'border-danger' : 'border-border',
          className
        )}
        {...rest}
      />
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
