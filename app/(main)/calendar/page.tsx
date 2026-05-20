// SCR-040 일정 (리스트/캘린더 토글)
import { AppBar } from '@/components/layout/AppBar';
import { FAB } from '@/components/layout/FAB';
import { CalendarClient } from './CalendarClient';
import { createClient } from '@/lib/supabase/server';
import { listEventsInRange } from '@/lib/api/events';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';

export const metadata = { title: '일정 · 원우회' };

export default async function CalendarPage() {
  const profile = await getCurrentProfile();
  const supabase = createClient();
  // 이번 달 +/- 1개월 분량 미리 로드
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const to = new Date(now.getFullYear(), now.getMonth() + 2, 1).toISOString();
  const events = await listEventsInRange(supabase, from, to).catch(() => []);

  return (
    <>
      <AppBar title="일정" />
      <div className="py-4">
        <CalendarClient initialEvents={events} />
      </div>
      {isOfficer(profile) && <FAB href="/calendar/new" label="일정 등록" icon="➕" />}
    </>
  );
}
