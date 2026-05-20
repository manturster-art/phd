// /demo/* 모든 페이지의 공통 레이아웃. 데모 모드 배너 + 사이드바 + 하단 탭바.
import type { ReactNode } from 'react';
import Link from 'next/link';
import { DemoBottomTabBar } from '@/components/layout/DemoBottomTabBar';
import { DemoSidebar } from '@/components/layout/DemoSidebar';

export const metadata = {
  title: '데모 — 원우회 프로토타입',
};

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-bg">
      {/* 프로토타입 안내 배너 */}
      <div
        role="status"
        className="sticky top-0 z-sticky border-b border-warning/40 bg-warning-bg px-4 py-2 text-center text-xs font-medium text-warning"
      >
        프로토타입 데모 모드 — Supabase 미연결, 실제 데이터 없음 ·{' '}
        <Link href="/demo" className="underline hover:no-underline">
          데모 홈
        </Link>
      </div>

      {/* 데스크톱에서만 좌측 사이드바 노출 */}
      <DemoSidebar />

      {/* 메인 영역 — 하단 탭바 공간 확보. */}
      <main
        className="app-container"
        style={{ paddingBottom: `calc(96px + var(--sab, 0px))` }}
      >
        {children}
      </main>

      {/* 데모용 하단 탭바 */}
      <DemoBottomTabBar />
    </div>
  );
}
