// C-401 DuesStatusBadge
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
};

const ICONS: Record<DuesStatus, string> = {
  paid: '✅',
  unpaid: '❌',
  exempt: '⚪',
  partial: '🟡',
};

export function DuesStatusBadge({ status }: Props) {
  const tone =
    status === 'paid' ? 'success' : status === 'unpaid' ? 'danger' : 'neutral';
  return (
    <Badge tone={tone}>
      <span aria-hidden>{ICONS[status]}</span>
      <span>{LABELS[status]}</span>
    </Badge>
  );
}
