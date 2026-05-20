// C-410 DuesHistoryCard
import { DuesStatusBadge } from './DuesStatusBadge';
import { formatDateShort, formatKRW } from '@/lib/utils/format';
import type { MyDuesRow } from '@/lib/api/dues';

interface Props {
  row: MyDuesRow;
}

export function DuesHistoryCard({ row }: Props) {
  const term = row.dues_term;
  return (
    <div className="border-b border-border px-4 py-4 last:border-b-0">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary">{term?.label ?? '항목 없음'}</p>
        <DuesStatusBadge status={row.status} />
      </div>
      <p className="mt-1 text-xs text-text-secondary">
        {row.status === 'exempt' ? '-' : formatKRW(term?.amount_krw)}
        {' · 갱신 '}
        {formatDateShort(row.updated_at)}
      </p>
      {row.memo && (
        <p className="mt-1 text-xs text-text-secondary">메모: {row.memo}</p>
      )}
    </div>
  );
}
