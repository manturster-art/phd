// C-150 BottomTabBar — Apple 그래머:
// white 배경 + 상단 1px hairline. 기본 ink, active 만 Action Blue. 그림자 없음.
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

interface Tab {
  href: string;
  label: string;
  icon: string;
  match: (p: string) => boolean;
}

const TABS: Tab[] = [
  { href: '/', label: '홈', icon: '🏠', match: (p) => p === '/' },
  { href: '/notices', label: '공지', icon: '📢', match: (p) => p.startsWith('/notices') },
  { href: '/board', label: '게시판', icon: '💬', match: (p) => p.startsWith('/board') },
  { href: '/calendar', label: '일정', icon: '📅', match: (p) => p.startsWith('/calendar') },
  { href: '/dues', label: '회비', icon: '💰', match: (p) => p.startsWith('/dues') },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주 탐색"
      className="fixed inset-x-0 bottom-0 z-bottomBar border-t border-border bg-surface"
      style={{ paddingBottom: `var(--sab, 0px)` }}
    >
      <div className="app-container flex">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-2',
                'min-h-[56px] active:scale-95 transition-transform',
                active
                  ? 'text-primary-500'
                  : 'text-text-primary'
              )}
            >
              <span aria-hidden className="text-lg leading-none">
                {tab.icon}
              </span>
              <span
                className={cn(
                  'text-xs',
                  active ? 'font-semibold' : 'font-normal text-text-secondary'
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
