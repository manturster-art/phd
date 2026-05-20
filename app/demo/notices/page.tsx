// SCR-020 데모 — 공지 목록
import { AppBar } from '@/components/layout/AppBar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { DemoNoticeCard } from '@/components/demo/DemoNoticeCard';
import { demoNotices } from '@/lib/demo/mockData';

export const metadata = { title: '데모 · 공지 목록' };

export default function DemoNoticesPage() {
  const notices = demoNotices;
  return (
    <>
      <AppBar title="공지" />
      <div className="py-4">
        {notices.length === 0 ? (
          <Card>
            <EmptyState icon="📢" title="아직 공지가 없어요" />
          </Card>
        ) : (
          <Card>
            {notices.map((n) => (
              <DemoNoticeCard key={n.id} notice={n} />
            ))}
          </Card>
        )}
      </div>
    </>
  );
}
