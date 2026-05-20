// C-450 DuesItemCard (회비 항목)
import Link from 'next/link';
import { formatKRW, formatDateShort } from '@/lib/utils/format';
import type { DuesTermItem } from '@/lib/api/dues';

interface Props {
  term: DuesTermItem;
  unpaidCount?: number;
}

export function DuesItemCard({ term, unpaidCount }: Props) {
  return (
    <Link
      href={`/dues/admin/items/${term.id}`}
      className="block border-b border-border px-4 py-3 last:border-b-0 hover:bg-bg-subtle"
    >
      <p className="text-sm font-semibold text-text-primary">{term.label}</p>
      <p className="mt-1 text-xs text-text-secondary">
        {formatKRW(term.amount_krw)}
        {term.due_date && ` · 마감 ${formatDateShort(term.due_date)}`}
      </p>
      {unpaidCount !== undefined && (
        <p className="mt-0.5 text-xs text-danger">미납 {unpaidCount}명</p>
      )}
    </Link>
  );
}
