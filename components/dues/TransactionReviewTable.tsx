// C-464 TransactionReviewTable (SCR-065 Phase C) — 매칭 결과 검토 리스트.
// Apple grammar: SegmentedControl 3-탭, hairline 카드, 그림자 0, pill chip.
// 모바일=세로 카드 리스트, 데스크톱(md~)도 동일 카드 레이아웃을 max-w 720 으로 사용.
'use client';

import { useMemo, useState } from 'react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { MatchStatusChip } from './MatchStatusChip';
import { formatDateTime, formatKRW } from '@/lib/utils/format';
import type {
  DuesMatchKind,
  DuesMatchType,
  DuesStatus,
} from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

export interface ReviewCandidate {
  paymentId: string;
  memberId: string;
  memberName: string;
  cohortYear: number | null;
  termLabel: string;
  termAmountKrw: number;
  currentStatus: DuesStatus;
  /** 가장 오래된 미납 = 추천 1순위 */
  recommended?: boolean;
}

export interface ReviewRow {
  /** 안정적 클라이언트 id (배열 인덱스+해시 기반). */
  id: string;
  rawPayerName: string;
  rawMemo: string | null;
  rawAmountKrw: number;
  rawTransactionDate: string; // ISO
  matchType: DuesMatchType | null; // null = none/multi 도 함께 표현 가능
  kind: DuesMatchKind;
  candidates: ReviewCandidate[];
  /** auto_* 또는 사용자 수동 선택 결과 */
  matchedPaymentId: string | null;
}

interface Props {
  rows: ReviewRow[];
  /** 후보 다수에서 선택한 결과를 부모에 반영 — kind='auto', matchedPaymentId=선택된 항목 */
  onPickCandidate: (
    rowId: string,
    candidate: ReviewCandidate,
    matchType: DuesMatchType
  ) => void;
}

type Tab = 'auto' | 'multi' | 'none';

export function TransactionReviewTable({ rows, onPickCandidate }: Props) {
  const [tab, setTab] = useState<Tab>('auto');
  const [sheetRowId, setSheetRowId] = useState<string | null>(null);

  const counts = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc[r.kind] = (acc[r.kind] ?? 0) + 1;
        return acc;
      },
      { auto: 0, multi: 0, none: 0 } as Record<DuesMatchKind, number>
    );
  }, [rows]);

  const filtered = useMemo(
    () => rows.filter((r) => r.kind === tab),
    [rows, tab]
  );

  const sheetRow = useMemo(
    () => (sheetRowId ? rows.find((r) => r.id === sheetRowId) ?? null : null),
    [rows, sheetRowId]
  );

  return (
    <div className="space-y-4">
      <SegmentedControl<Tab>
        value={tab}
        onChange={(v) => setTab(v)}
        options={[
          { label: `✅ 자동 ${counts.auto}`, value: 'auto' },
          { label: `⚠ 후보 ${counts.multi}`, value: 'multi' },
          { label: `❌ 미매칭 ${counts.none}`, value: 'none' },
        ]}
      />

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface px-4 py-12 text-center text-sm text-text-secondary">
          이 그룹에 해당하는 거래가 없어요
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((row) => (
            <li
              key={row.id}
              className="rounded-lg border border-border bg-surface px-4 py-4"
            >
              <header className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-text-muted">
                    {formatDateTime(row.rawTransactionDate)}
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-text-primary">
                    {row.rawPayerName} · {formatKRW(row.rawAmountKrw)}
                  </p>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    메모: {row.rawMemo?.trim() || '(없음)'}
                  </p>
                </div>
                <MatchStatusChip kind={row.kind} />
              </header>

              <div className="mt-3 border-t border-border pt-3">
                {row.kind === 'auto' && row.candidates[0] && (
                  <p className="text-sm text-text-primary">
                    → <strong>{row.candidates[0].memberName}</strong> ·{' '}
                    {row.candidates[0].termLabel} (
                    {formatKRW(row.candidates[0].termAmountKrw)})
                  </p>
                )}
                {row.kind === 'multi' && (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-text-secondary">
                      후보 {row.candidates.length}건
                    </p>
                    <button
                      type="button"
                      onClick={() => setSheetRowId(row.id)}
                      className="rounded-pill px-2 text-sm text-primary-500 underline-offset-2 hover:underline active:scale-95 transition-transform"
                    >
                      선택하기 →
                    </button>
                  </div>
                )}
                {row.kind === 'none' && (
                  <p className="text-sm text-text-muted">
                    매칭 가능한 회원/항목을 찾지 못했어요. 이 거래는 일괄 확정에서
                    제외됩니다.
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {sheetRow && (
        <CandidatePickSheet
          row={sheetRow}
          onClose={() => setSheetRowId(null)}
          onPick={(candidate) => {
            onPickCandidate(sheetRow.id, candidate, 'manual');
            setSheetRowId(null);
          }}
        />
      )}
    </div>
  );
}

function CandidatePickSheet({
  row,
  onClose,
  onPick,
}: {
  row: ReviewRow;
  onClose: () => void;
  onPick: (c: ReviewCandidate) => void;
}) {
  const [picked, setPicked] = useState<string | null>(
    () => row.candidates.find((c) => c.recommended)?.paymentId ?? null
  );
  const sorted = useMemo(() => {
    return [...row.candidates].sort(
      (a, b) =>
        (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0) ||
        a.termLabel.localeCompare(b.termLabel)
    );
  }, [row.candidates]);

  return (
    <Sheet open onClose={onClose} title="거래 매칭">
      <p className="-mt-3 mb-3 text-sm text-text-secondary">
        {row.rawPayerName} · {formatKRW(row.rawAmountKrw)} ·{' '}
        {formatDateTime(row.rawTransactionDate)}
      </p>
      <p className="mb-2 text-sm font-semibold text-text-secondary">
        후보 회원 / 회비 항목
      </p>
      <ul className="space-y-2">
        {sorted.map((c) => (
          <li key={c.paymentId}>
            <label
              className={cn(
                'flex items-center gap-3 rounded-lg border bg-surface px-4 py-3 cursor-pointer',
                picked === c.paymentId
                  ? 'border-primary-500'
                  : 'border-border'
              )}
            >
              <input
                type="radio"
                name="candidate"
                value={c.paymentId}
                checked={picked === c.paymentId}
                onChange={() => setPicked(c.paymentId)}
                className="accent-primary-500"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  {c.recommended && <span aria-label="추천">⭐ </span>}
                  {c.memberName}
                  {c.cohortYear != null && (
                    <span className="ml-2 text-xs font-normal text-text-secondary">
                      ({c.cohortYear}학번)
                    </span>
                  )}
                  <span className="ml-2 text-sm font-normal text-text-secondary">
                    · {c.termLabel}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {formatKRW(c.termAmountKrw)} · 현재 상태 {c.currentStatus}
                  {c.recommended && (
                    <span className="ml-1 text-primary-500">· 추천</span>
                  )}
                </p>
              </div>
            </label>
          </li>
        ))}
      </ul>
      <div className="-mx-6 mt-4 flex items-center gap-2 border-t border-border bg-surface px-6 pt-4">
        <Button variant="secondary" onClick={onClose}>
          취소
        </Button>
        <Button
          variant="primary"
          fullWidth
          disabled={!picked}
          onClick={() => {
            const c = sorted.find((x) => x.paymentId === picked);
            if (c) onPick(c);
          }}
        >
          자동매칭으로 이동
        </Button>
      </div>
    </Sheet>
  );
}
