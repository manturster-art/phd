// C-401 DuesStatusBadge
// v0.3 (06_designer §3): pending_payment / rejected 매핑 추가.
// 색·아이콘·한국어 라벨을 동시에 표기 (접근성: 색 단독 금지).
import { Badge } from '@/components/ui/Badge';
import type { DuesStatus } from '@/lib/types/database';

interface Props {
  status: DuesStatus;
}

const LABELS: Record<DuesStatus, string> = {
  paid: '납부완료',
  unpaid: '미납',
  exempt: '면제',
  partial: '부분납부',
  pending_payment: '검토중',
  rejected: '반려됨',
};

const ICONS: Record<DuesStatus, string> = {
  paid: '✅',
  unpaid: '❌',
  exempt: '⚪',
  partial: '🟡',
  pending_payment: '⏳',
  rejected: '🚫',
};

const TONES: Record<DuesStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  paid: 'success',
  unpaid: 'danger',
  exempt: 'neutral',
  partial: 'warning',
  pending_payment: 'warning',
  rejected: 'danger',
};

export function DuesStatusBadge({ status }: Props) {
  return (
    <Badge tone={TONES[status]}>
      <span aria-hidden>{ICONS[status]}</span>
      <span>{LABELS[status]}</span>
    </Badge>
  );
}
