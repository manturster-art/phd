// SCR-010 데모 — 홈 대시보드
import Link from 'next/link';
import { AppBar } from '@/components/layout/AppBar';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { DuesStatusBadge } from '@/components/dues/DuesStatusBadge';
import { DemoNoticeCard } from '@/components/demo/DemoNoticeCard';
import { DemoEventListItem } from '@/components/demo/DemoEventListItem';
import {
  currentDemoMember,
  demoNotices,
  demoEvents,
  demoMyDues,
} from '@/lib/demo/mockData';
import { formatDateShort, formatKRW } from '@/lib/utils/format';

export const metadata = { title: '데모 · 홈' };

export default function DemoHomePage() {
  const notices = demoNotices.slice(0, 3);
  const upcoming = demoEvents
    .slice()
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, 3);
  const latestDues = demoMyDues[0] ?? null;

  return (
    <>
      <AppBar
        title="원우회"
        trailing={
          <span
            aria-label="내 프로필"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-sm font-semibold"
          >
            {currentDemoMember.name.slice(0, 1)}
          </span>
        }
      />
      <section className="py-4">
        <p className="text-base">
          안녕하세요, <strong>{currentDemoMember.name}</strong>님 👋
        </p>
      </section>

      <SectionHeader
        title="최신 공지"
        icon="📢"
        action={{ label: '더보기', href: '/demo/notices' }}
      />
      {notices.length === 0 ? (
        <Card>
          <EmptyState title="아직 등록된 공지가 없어요" />
        </Card>
      ) : (
        <Card>
          {notices.map((n) => (
            <DemoNoticeCard key={n.id} notice={n} />
          ))}
        </Card>
      )}

      <SectionHeader
        title="다가오는 일정"
        icon="📅"
        action={{ label: '더보기', href: '/demo/calendar' }}
      />
      {upcoming.length === 0 ? (
        <Card>
          <EmptyState title="예정된 일정이 없습니다" />
        </Card>
      ) : (
        <Card>
          {upcoming.map((e) => (
            <DemoEventListItem key={e.id} event={e} />
          ))}
        </Card>
      )}

      <SectionHeader
        title="내 회비"
        icon="💰"
        action={{ label: '자세히', href: '/demo/dues-member' }}
      />
      {latestDues ? (
        <Link href="/demo/dues-member" className="block">
          <Card>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  {latestDues.dues_term?.label ?? '회비'}
                </p>
                <DuesStatusBadge status={latestDues.status} />
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                {formatKRW(latestDues.dues_term?.amount_krw)} ·{' '}
                {formatDateShort(latestDues.updated_at)} 갱신
              </p>
            </div>
          </Card>
        </Link>
      ) : (
        <Card>
          <EmptyState title="아직 회비 항목이 없습니다" />
        </Card>
      )}
    </>
  );
}
