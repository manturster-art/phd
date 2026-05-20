// 데모 전용 하단 탭바. Apple 그래머는 BottomTabBar 와 동일.
// 아이콘: 라인 SVG (currentColor) — active 시 filled variant + primary-500.
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ComponentType, SVGProps } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  BellIcon,
  BubbleIcon,
  CalendarIcon,
  HomeIcon,
  WonIcon,
} from '@/components/icons/TabIcons';

type TabIcon = ComponentType<SVGProps<SVGSVGElement> & { filled?: boolean }>;

interface Tab {
  href: string;
  label: string;
  Icon: TabIcon;
  match: (p: string) => boolean;
}

const TABS: Tab[] = [
  { href: '/demo/home', label: '홈', Icon: HomeIcon, match: (p) => p === '/demo/home' },
  {
    href: '/demo/notices',
    label: '공지',
    Icon: BellIcon,
    match: (p) => p.startsWith('/demo/notices'),
  },
  {
    href: '/demo/board',
    label: '게시판',
    Icon: BubbleIcon,
    match: (p) => p.startsWith('/demo/board'),
  },
  {
    href: '/demo/calendar',
    label: '일정',
    Icon: CalendarIcon,
    match: (p) => p.startsWith('/demo/calendar'),
  },
  {
    href: '/demo/dues-member',
    label: '회비',
    Icon: WonIcon,
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
          const { Icon } = tab;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2',
                'min-h-[56px] active:scale-95 transition-transform',
                active ? 'text-primary-500' : 'text-text-secondary'
              )}
            >
              <Icon filled={active} className="h-6 w-6" />
              <span
                className={cn(
                  'text-[11px] leading-none',
                  active ? 'font-semibold' : 'font-normal'
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
