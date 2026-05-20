'use client';

import { useMemo, useState } from 'react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { EventListItem } from '@/components/event/EventListItem';
import { CalendarGrid } from '@/components/event/CalendarGrid';
import type { Event } from '@/lib/api/events';

interface Props {
  initialEvents: Event[];
}

type Mode = 'list' | 'calendar';

export function CalendarClient({ initialEvents }: Props) {
  const [mode, setMode] = useState<Mode>('list');
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const upcoming = useMemo(() => {
    const today = new Date();
    return initialEvents
      .filter((e) => new Date(e.starts_at) >= today)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }, [initialEvents]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return initialEvents.filter((e) => {
      const d = new Date(e.starts_at);
      const kstDate = new Date(d.getTime() + 9 * 3600 * 1000)
        .toISOString()
        .slice(0, 10);
      return kstDate === selectedDate;
    });
  }, [initialEvents, selectedDate]);

  return (
    <div className="space-y-4">
      <SegmentedControl
        options={[
          { label: '리스트', value: 'list' },
          { label: '캘린더', value: 'calendar' },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === 'list' ? (
        upcoming.length === 0 ? (
          <Card><EmptyState icon="📅" title="예정된 일정이 없습니다" /></Card>
        ) : (
          <Card>{upcoming.map((e) => <EventListItem key={e.id} event={e} />)}</Card>
        )
      ) : (
        <>
          <CalendarGrid
            year={year}
            month={month}
            events={initialEvents}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            onPrevMonth={() => {
              const m = month - 1;
              if (m < 1) { setMonth(12); setYear(year - 1); } else setMonth(m);
            }}
            onNextMonth={() => {
              const m = month + 1;
              if (m > 12) { setMonth(1); setYear(year + 1); } else setMonth(m);
            }}
          />
          {selectedDate && (
            <Card>
              {selectedDayEvents.length === 0 ? (
                <EmptyState title={`${selectedDate}에 일정이 없습니다`} />
              ) : (
                selectedDayEvents.map((e) => <EventListItem key={e.id} event={e} />)
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
