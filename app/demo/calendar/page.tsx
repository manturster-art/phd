// SCR-040 데모 — 일정 (리스트 + 캘린더 토글)
import { AppBar } from '@/components/layout/AppBar';
import { DemoCalendarClient } from './DemoCalendarClient';
import { demoEvents } from '@/lib/demo/mockData';

export const metadata = { title: '데모 · 일정' };

export default function DemoCalendarPage() {
  return (
    <>
      <AppBar title="일정" />
      <div className="py-4">
        <DemoCalendarClient initialEvents={demoEvents} />
      </div>
    </>
  );
}
