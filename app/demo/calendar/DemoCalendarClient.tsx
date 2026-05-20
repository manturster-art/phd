// 데모 모드 캘린더 클라이언트. 실제 CalendarClient 와 거의 동일하지만
// 일정 항목 클릭 시 alert 만 노출하는 DemoEventListItem 을 사용한다.
'use client';

import { useMemo, useState } from 'react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { CalendarGrid } from '@/components/event/CalendarGrid';
import { DemoEventListItem } from '@/components/demo/DemoEventListItem';
import type { Event } from '@/lib/api/events';

interface Props {
  initialEvents: Event[];
}

type Mode = 'list' | 'calendar';

export function DemoCalendarClient({ initialEvents }: Props) {
  const [mode, setMode] = useState<Mode>('list');
  // 데모는 2026-05 기준으로 고정.
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const upcoming = useMemo(() => {
    return initialEvents
      .slice()
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
          <Card>
            <EmptyState icon="📅" title="예정된 일정이 없습니다" />
          </Card>
        ) : (
          <Card>
            {upcoming.map((e) => (
              <DemoEventListItem key={e.id} event={e} />
            ))}
          </Card>
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
              if (m < 1) {
                setMonth(12);
                setYear(year - 1);
              } else setMonth(m);
            }}
            onNextMonth={() => {
              const m = month + 1;
              if (m > 12) {
                setMonth(1);
                setYear(year + 1);
              } else setMonth(m);
            }}
          />
          {selectedDate && (
            <Card>
              {selectedDayEvents.length === 0 ? (
                <EmptyState title={`${selectedDate}에 일정이 없습니다`} />
              ) : (
                selectedDayEvents.map((e) => (
                  <DemoEventListItem key={e.id} event={e} />
                ))
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
