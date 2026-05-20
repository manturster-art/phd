// C-465 MatchStatusChip
// SCR-065 CSV 매칭 결과 화면에서 거래 행의 매칭 상태를 표시하는 칩.
// Apple grammar: pill / 14px / 색+텍스트 동시 표현 (색 단독 금지).
import type { DuesMatchKind } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

interface Props {
  kind: DuesMatchKind;
  /** 탭 헤더에서 카운트와 함께 표시할 때 사용. ex) `자동 118` */
  count?: number;
  className?: string;
}

const LABELS: Record<DuesMatchKind, string> = {
  auto: '자동',
  multi: '후보',
  none: '미매칭',
};

const TONE_CLASS: Record<DuesMatchKind, string> = {
  auto: 'bg-primary-100 text-primary-500',
  multi: 'bg-warning-bg text-warning',
  none: 'bg-bg text-text-muted',
};

export function MatchStatusChip({ kind, count, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-sm font-semibold',
        TONE_CLASS[kind],
        className
      )}
      aria-label={
        count != null
          ? `${LABELS[kind]} ${count}건`
          : `매칭 상태 ${LABELS[kind]}`
      }
    >
      <span>{LABELS[kind]}</span>
      {count != null && <span aria-hidden>{count}</span>}
    </span>
  );
}
