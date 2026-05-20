'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { DuesMatrixRow } from '@/components/dues/DuesMatrixRow';
import { DuesMatrixTable } from '@/components/dues/DuesMatrixTable';
import { DuesEditSheet } from '@/components/dues/DuesEditSheet';
import type { DuesMatrixRow as MatrixRow, DuesTermItem } from '@/lib/api/dues';

interface Props {
  terms: DuesTermItem[];
  activeTermId: string;
  matrix: MatrixRow[];
  officerId: string;
}

type StatusFilter = 'all' | 'paid' | 'unpaid' | 'exempt';

export function DuesAdminClient({ terms, activeTermId, matrix, officerId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(false);
  const [editRow, setEditRow] = useState<MatrixRow | null>(null);

  const activeTerm = terms.find((t) => t.id === activeTermId);

  const filtered = useMemo(() => {
    return matrix.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const name = r.member?.name?.toLowerCase() ?? '';
        if (!name.includes(q)) return false;
      }
      return true;
    });
  }, [matrix, filter, query]);

  const stats = useMemo(() => {
    const total = matrix.length;
    const paid = matrix.filter((r) => r.status === 'paid').length;
    const unpaid = matrix.filter((r) => r.status === 'unpaid').length;
    const exempt = matrix.filter((r) => r.status === 'exempt').length;
    return { total, paid, unpaid, exempt };
  }, [matrix]);

  const onTermChange = (termId: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('term', termId);
    router.replace(`/dues/admin?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-text-secondary">학기</label>
        <select
          value={activeTermId}
          onChange={(e) => onTermChange(e.target.value)}
          className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3 text-base"
        >
          {terms.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      <TextField
        placeholder="회원 이름 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={() => setComposing(false)}
        data-composing={composing || undefined}
      />

      <SegmentedControl
        options={[
          { label: '전체', value: 'all' },
          { label: '납부', value: 'paid' },
          { label: '미납', value: 'unpaid' },
          { label: '면제', value: 'exempt' },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <div className="rounded-md bg-bg-subtle px-3 py-2 text-xs text-text-secondary">
        총원 {stats.total} · 납부 {stats.paid} · 미납 {stats.unpaid} · 면제 {stats.exempt}
      </div>

      {/* 모바일: 리스트 */}
      <div className="md:hidden">
        {filtered.length === 0 ? (
          <Card><EmptyState title="조건에 맞는 회원이 없어요" /></Card>
        ) : (
          <Card>{filtered.map((r) => (
            <DuesMatrixRow key={r.id} row={r} onTap={() => setEditRow(r)} />
          ))}</Card>
        )}
      </div>

      {/* 데스크톱: 테이블 */}
      <div className="hidden md:block">
        {filtered.length === 0 ? (
          <Card><EmptyState title="조건에 맞는 회원이 없어요" /></Card>
        ) : (
          <DuesMatrixTable rows={filtered} onCellTap={(r) => setEditRow(r)} />
        )}
      </div>

      <DuesEditSheet
        open={editRow != null}
        row={editRow}
        termLabel={activeTerm?.label ?? ''}
        officerId={officerId}
        onClose={() => setEditRow(null)}
      />
    </div>
  );
}
