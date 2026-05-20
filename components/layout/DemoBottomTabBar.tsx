// 데모 전용 하단 탭바. Apple 그래머는 BottomTabBar 와 동일.
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
  { href: '/demo/home', label: '홈', icon: '🏠', match: (p) => p === '/demo/home' },
  {
    href: '/demo/notices',
    label: '공지',
    icon: '📢',
    match: (p) => p.startsWith('/demo/notices'),
  },
  {
    href: '/demo/board',
    label: '게시판',
    icon: '💬',
    match: (p) => p.startsWith('/demo/board'),
  },
  {
    href: '/demo/calendar',
    label: '일정',
    icon: '📅',
    match: (p) => p.startsWith('/demo/calendar'),
  },
  {
    href: '/demo/dues-member',
    label: '회비',
    icon: '💰',
    match: (p) => p.startsWith('/demo/dues'),
  },
];

export function DemoBottomTabBar() {
  const pathname = usePathname() ?? '';
  return (
    <nav
      aria-label="주 탐색 (데모)"
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
                active ? 'text-primary-500' : 'text-text-primary'
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
