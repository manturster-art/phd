import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { RegisterSW } from '@/components/layout/RegisterSW';
import { getCurrentProfile } from '@/lib/utils/auth';

export default async function MainLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.status === 'pending') redirect('/signup/pending');
  if (profile.status === 'suspended' || profile.status === 'withdrawn') redirect('/login?reason=' + profile.status);

  return (
    <div className="min-h-[100dvh] bg-bg">
      <RegisterSW />
      <main
        className="app-container"
        style={{ paddingBottom: `calc(96px + var(--sab, 0px))` }}
      >
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
