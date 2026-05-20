// SCR-041 일정 상세
import { notFound } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { createClient } from '@/lib/supabase/server';
import { getEvent } from '@/lib/api/events';
import { formatDateTime } from '@/lib/utils/format';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';
import { EventMenu } from './EventMenu';

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  const supabase = createClient();
  const event = await getEvent(supabase, params.id);
  if (!event) notFound();

  return (
    <>
      <AppBar
        title="일정"
        leading="back"
        trailing={isOfficer(profile) ? <EventMenu eventId={event.id} /> : null}
      />
      <article className="py-5">
        <h1 className="text-2xl font-bold leading-tight">{event.title}</h1>
        <p className="mt-3 text-sm text-text-secondary">📅 {formatDateTime(event.starts_at)}</p>
        {event.location && (
          <p className="mt-1 text-sm text-text-secondary">📍 {event.location}</p>
        )}
        {event.description_md && (
          <div className="mt-5 whitespace-pre-wrap break-words text-base leading-relaxed text-text-primary">
            {event.description_md}
          </div>
        )}
      </article>
    </>
  );
}
