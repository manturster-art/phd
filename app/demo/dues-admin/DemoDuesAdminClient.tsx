// 데모 회비 매트릭스 클라이언트. 실제 DuesAdminClient 와 유사하지만
// - 학기 변경 시 URL 변경 없이 로컬 state 만 사용
// - 셀 클릭 시 alert 만 노출 (DuesEditSheet 미사용)
'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { DuesStatusBadge } from '@/components/dues/DuesStatusBadge';
import type { DuesMatrixRow, DuesTermItem } from '@/lib/api/dues';

interface Props {
  terms: DuesTermItem[];
  matrix: DuesMatrixRow[];
}

type StatusFilter = 'all' | 'paid' | 'unpaid' | 'exempt';

export function DemoDuesAdminClient({ terms, matrix }: Props) {
  // 데모는 단일 학기 데이터만 보유 — 학기 셀렉트는 UI 만 노출.
  const [activeTermId, setActiveTermId] = useState(terms[0]?.id ?? '');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(false);

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

  const handleRowTap = (row: DuesMatrixRow) => {
    alert(
      `[데모] ${row.member?.name ?? '회원'} 상태 변경 시트가 열립니다.\n` +
        `현재 상태: ${row.status}\n` +
        `메모: ${row.memo ?? '(없음)'}`
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-text-secondary">학기</label>
        <select
          value={activeTermId}
          onChange={(e) => setActiveTermId(e.target.value)}
          className="mt-1 h-11 w-full rounded-lg border border-border bg-surface px-4 text-base"
        >
          {terms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
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

      <div className="rounded-lg bg-bg px-4 py-2.5 text-xs text-text-secondary">
        총원 {stats.total} · 납부 {stats.paid} · 미납 {stats.unpaid} · 면제{' '}
        {stats.exempt}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState title="조건에 맞는 회원이 없어요" />
        </Card>
      ) : (
        <Card>
          {filtered.map((row) => {
            const m = row.member;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => handleRowTap(row)}
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
                      <span className="ml-1 text-xs text-text-secondary">
                        · {m.lab}
                      </span>
                    )}
                  </p>
                  <DuesStatusBadge status={row.status} />
                </div>
                {row.memo && (
                  <p className="mt-1 text-xs text-text-secondary">
                    메모: {row.memo}
                    {!row.memo_public && (
                      <span className="ml-1 text-text-muted">(임원 내부)</span>
                    )}
                  </p>
                )}
              </button>
            );
          })}
        </Card>
      )}
    </div>
  );
}
