// 데모 전용 EventListItem 래퍼 — 링크를 비활성화 (alert 만 노출).
'use client';

import { formatDateTime } from '@/lib/utils/format';
import type { Event } from '@/lib/api/events';

export function DemoEventListItem({ event }: { event: Event }) {
  return (
    <button
      type="button"
      onClick={() =>
        alert(
          `[데모] ${event.title}\n${formatDateTime(event.starts_at)}\n${event.location ?? ''}`
        )
      }
      className="block w-full border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-bg-subtle"
    >
      <p className="text-sm font-semibold text-text-primary">{event.title}</p>
      <p className="mt-1 text-xs text-text-secondary">
        📅 {formatDateTime(event.starts_at)}
      </p>
      {event.location && (
        <p className="mt-0.5 text-xs text-text-secondary">📍 {event.location}</p>
      )}
    </button>
  );
}
