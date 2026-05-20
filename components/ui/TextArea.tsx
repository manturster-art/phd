// C-102 TextArea — Apple 그래머: 18px 라운드 박스 + focus 시 2px Action Blue 링.
'use client';

import {
  forwardRef,
  useId,
  useState,
  type TextareaHTMLAttributes,
} from 'react';
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

  // IME 조합 중 Enter 자동 제출 방지용. 호출자에서 data-composing 으로 활용 가능.
  const [composing, setComposing] = useState(false);

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
          'w-full rounded-lg border bg-surface px-4 py-3 text-base text-text-primary',
          'placeholder:text-text-muted outline-none focus:shadow-focus',
          'resize-y',
          error ? 'border-danger' : 'border-border',
          className
        )}
        {...rest}
      />
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
