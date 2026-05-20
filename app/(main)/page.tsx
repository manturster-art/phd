// SCR-010 홈 대시보드
import Link from 'next/link';
import { AppBar } from '@/components/layout/AppBar';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { NoticeCard } from '@/components/notice/NoticeCard';
import { EventListItem } from '@/components/event/EventListItem';
import { DuesStatusBadge } from '@/components/dues/DuesStatusBadge';
import { createClient } from '@/lib/supabase/server';
import { listNotices } from '@/lib/api/notices';
import { listUpcomingEvents } from '@/lib/api/events';
import { listMyDues } from '@/lib/api/dues';
import { getCurrentProfile } from '@/lib/utils/auth';
import { formatDateShort, formatKRW } from '@/lib/utils/format';

export const metadata = { title: '홈 · 원우회' };

export default async function HomePage() {
  const profile = await getCurrentProfile();
  const supabase = createClient();
  const [notices, events, myDues] = await Promise.all([
    listNotices(supabase, 3).catch(() => []),
    listUpcomingEvents(supabase, 3).catch(() => []),
    profile ? listMyDues(supabase, profile.id).catch(() => []) : Promise.resolve([]),
  ]);

  const latestDues = myDues[0] ?? null;

  return (
    <>
      <AppBar
        title="원우회"
        trailing={
          <Link
            href="/me"
            aria-label="내 프로필"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-text-primary text-sm font-semibold"
          >
            {(profile?.name ?? '?').slice(0, 1)}
          </Link>
        }
      />
      <section className="py-4">
        <p className="text-base">
          안녕하세요, <strong>{profile?.name ?? '회원'}</strong>님 👋
        </p>
      </section>

      <SectionHeader title="최신 공지" icon="📢" action={{ label: '더보기', href: '/notices' }} />
      {notices.length === 0 ? (
        <Card><EmptyState title="아직 등록된 공지가 없어요" /></Card>
      ) : (
        <Card>{notices.map((n) => <NoticeCard key={n.id} notice={n} />)}</Card>
      )}

      <SectionHeader title="다가오는 일정" icon="📅" action={{ label: '더보기', href: '/calendar' }} />
      {events.length === 0 ? (
        <Card><EmptyState title="예정된 일정이 없습니다" /></Card>
      ) : (
        <Card>{events.map((e) => <EventListItem key={e.id} event={e} />)}</Card>
      )}

      <SectionHeader title="내 회비" icon="💰" action={{ label: '자세히', href: '/dues' }} />
      {latestDues ? (
        <Card>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{latestDues.dues_term?.label ?? '회비'}</p>
              <DuesStatusBadge status={latestDues.status} />
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              {formatKRW(latestDues.dues_term?.amount_krw)} · {formatDateShort(latestDues.updated_at)} 갱신
            </p>
          </div>
        </Card>
      ) : (
        <Card><EmptyState title="아직 회비 항목이 없습니다" /></Card>
      )}
    </>
  );
}
