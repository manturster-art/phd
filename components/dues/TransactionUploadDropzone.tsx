// C-463 TransactionUploadDropzone (SCR-065 Phase A) — CSV/XLSX 드롭존.
// Apple grammar: 2px dashed border (idle) → solid primary-500 (dragOver),
// 그림자 0, rounded-lg(18px). 키보드 Enter/Space 로 파일 다이얼로그 호출.
'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface Props {
  /** ex) ['.csv', '.xlsx'] */
  accept: string[];
  maxSizeBytes: number;
  maxRows?: number;
  onFile: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export function TransactionUploadDropzone({
  accept,
  maxSizeBytes,
  maxRows = 1000,
  onFile,
  disabled,
  className,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(
    (file: File): string | null => {
      const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
      if (!accept.includes(ext)) {
        return `지원하지 않는 형식이에요. (${accept.join(', ')})`;
      }
      if (file.size > maxSizeBytes) {
        return `파일이 너무 커요. 최대 ${Math.round(maxSizeBytes / (1024 * 1024))}MB`;
      }
      return null;
    },
    [accept, maxSizeBytes]
  );

  const handleFile = (file: File) => {
    setError(null);
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }
    onFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onPickClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPickClick();
    }
  };

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="CSV 또는 XLSX 파일 업로드"
        onClick={onPickClick}
        onKeyDown={onKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'flex min-h-[200px] cursor-pointer flex-col items-center justify-center',
          'rounded-lg px-6 py-12 text-center transition-colors duration-base ease-standard',
          'border-2 border-dashed',
          'active:scale-95',
          dragOver
            ? 'border-primary-500 bg-primary-50'
            : 'border-border bg-bg-subtle',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span aria-hidden className="text-3xl text-text-muted">
          ⬆
        </span>
        <p className="mt-3 text-base text-text-primary">
          CSV/XLSX 파일을 끌어다 놓거나 눌러서 선택하세요
        </p>
        <p className="mt-1 text-xs text-text-muted">
          최대 {Math.round(maxSizeBytes / (1024 * 1024))}MB ·{' '}
          {maxRows.toLocaleString('ko-KR')}행 이하
        </p>
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept.join(',')}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          // 같은 파일 재선택 허용
          e.target.value = '';
        }}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
