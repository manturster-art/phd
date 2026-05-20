// SCR-020 공지 목록
import { AppBar } from '@/components/layout/AppBar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FAB } from '@/components/layout/FAB';
import { NoticeCard } from '@/components/notice/NoticeCard';
import { createClient } from '@/lib/supabase/server';
import { listNotices } from '@/lib/api/notices';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';

export const metadata = { title: '공지 · 원우회' };

export default async function NoticesPage() {
  const profile = await getCurrentProfile();
  const supabase = createClient();
  const notices = await listNotices(supabase, 50).catch(() => []);

  return (
    <>
      <AppBar title="공지" />
      <div className="py-4">
        {notices.length === 0 ? (
          <Card><EmptyState icon="📢" title="아직 공지가 없어요" /></Card>
        ) : (
          <Card>{notices.map((n) => <NoticeCard key={n.id} notice={n} />)}</Card>
        )}
      </div>
      {isOfficer(profile) && <FAB href="/notices/new" label="공지 작성" icon="➕" />}
    </>
  );
}
