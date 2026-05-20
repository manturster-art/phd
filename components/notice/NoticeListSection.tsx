import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { NoticeCard } from './NoticeCard';
import type { NoticeListItem } from '@/lib/api/notices';

export function NoticeListSection({ notices }: { notices: NoticeListItem[] }) {
  if (notices.length === 0) {
    return (
      <Card>
        <EmptyState icon="📢" title="아직 등록된 공지가 없어요" />
      </Card>
    );
  }
  return (
    <Card>
      {notices.map((n) => (
        <NoticeCard key={n.id} notice={n} />
      ))}
    </Card>
  );
}
