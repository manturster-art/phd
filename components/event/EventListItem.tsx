// C-310 EventListItem
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils/format';
import type { Event } from '@/lib/api/events';

interface Props {
  event: Event;
}

export function EventListItem({ event }: Props) {
  return (
    <Link
      href={`/calendar/${event.id}`}
      className="block border-b border-border px-4 py-3 last:border-b-0 hover:bg-bg transition-colors"
    >
      <p className="text-sm font-semibold text-text-primary">{event.title}</p>
      <p className="mt-1 text-xs text-text-secondary">
        📅 {formatDateTime(event.starts_at)}
      </p>
      {event.location && (
        <p className="mt-0.5 text-xs text-text-secondary">📍 {event.location}</p>
      )}
    </Link>
  );
}
