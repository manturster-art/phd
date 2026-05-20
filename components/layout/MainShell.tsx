import { type ReactNode } from 'react';
import { BottomTabBar } from './BottomTabBar';

export function MainShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-bg">
      {/* AppBar는 각 페이지가 직접 렌더 */}
      <main
        className="app-container pb-24"
        style={{ paddingBottom: `calc(96px + var(--sab, 0px))` }}
      >
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
