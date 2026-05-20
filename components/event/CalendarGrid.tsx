// C-330 CalendarGrid + C-331 DateChip
'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import type { Event } from '@/lib/api/events';

interface Props {
  year: number;
  month: number; // 1-12
  events: Event[];
  selectedDate: string | null; // YYYY-MM-DD
  onSelect: (dateStr: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function CalendarGrid({
  year,
  month,
  events,
  selectedDate,
  onSelect,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const cells = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const startDay = first.getDay(); // 0=일
    const lastDate = new Date(year, month, 0).getDate();
    const totalCells = Math.ceil((startDay + lastDate) / 7) * 7;
    return Array.from({ length: totalCells }, (_, idx) => {
      const dayNum = idx - startDay + 1;
      if (dayNum < 1 || dayNum > lastDate) return null;
      return new Date(year, month - 1, dayNum);
    });
  }, [year, month]);

  const eventDates = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) {
      const d = new Date(e.starts_at);
      // KST 기준 YYYY-MM-DD
      const kstDate = new Date(d.getTime() + 9 * 3600 * 1000)
        .toISOString()
        .slice(0, 10);
      set.add(kstDate);
    }
    return set;
  }, [events]);

  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          onClick={onPrevMonth}
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-bg-subtle"
        >
          ‹
        </button>
        <p className="text-sm font-semibold">{year}년 {month}월</p>
        <button
          type="button"
          aria-label="다음 달"
          onClick={onNextMonth}
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-bg-subtle"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={cn(
              'text-center text-xs font-medium py-1',
              i === 0 && 'text-danger',
              i === 6 && 'text-info'
            )}
          >
            {w}
          </div>
        ))}
        {cells.map((d, idx) => {
          if (!d) return <div key={idx} />;
          const dateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 10);
          const hasEvent = eventDates.has(dateStr);
          const selected = selectedDate === dateStr;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(dateStr)}
              className={cn(
                'flex h-10 flex-col items-center justify-center rounded-md text-sm',
                selected
                  ? 'bg-primary-500 text-white'
                  : 'hover:bg-bg-subtle text-text-primary'
              )}
            >
              <span>{d.getDate()}</span>
              {hasEvent && !selected && (
                <span className="h-1 w-1 rounded-full bg-primary-500" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
