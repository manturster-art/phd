// C-420 DuesMatrixRow (모바일)
'use client';

import { DuesStatusBadge } from './DuesStatusBadge';
import type { DuesMatrixRow as DuesMatrixRowType } from '@/lib/api/dues';

interface Props {
  row: DuesMatrixRowType;
  onTap: () => void;
}

export function DuesMatrixRow({ row, onTap }: Props) {
  const m = row.member;
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`${m?.name ?? '회원'} 상태 ${row.status}, 변경하려면 누르세요`}
      className="block w-full border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-bg transition-colors"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-primary">
          {m?.name ?? '(탈퇴회원)'}
          {m?.cohort_year != null && (
            <span className="ml-2 text-xs text-text-secondary">
              · {m.cohort_year}학번
            </span>
          )}
          {m?.lab && (
            <span className="ml-1 text-xs text-text-secondary">· {m.lab}</span>
          )}
        </p>
        <DuesStatusBadge status={row.status} />
      </div>
      {row.memo && (
        <p className="mt-1 text-xs text-text-secondary">메모: {row.memo}</p>
      )}
    </button>
  );
}
