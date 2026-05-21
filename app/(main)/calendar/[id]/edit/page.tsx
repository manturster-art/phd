// SCR-042 일정 수정 — 임원/관리자만 진입 가능
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEvent } from '@/lib/api/events';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';
import { EventEditor } from '../../new/EventEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: '일정 수정 · 원우회' };

export default async function EventEditPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!isOfficer(profile)) redirect('/calendar');

  const supabase = createClient();
  const event = await getEvent(supabase, params.id);
  if (!event) notFound();

  return (
    <EventEditor
      mode="edit"
      eventId={event.id}
      initial={{
        title: event.title,
        starts_at: event.starts_at,
        ends_at: event.ends_at,
        location: event.location,
        description_md: event.description_md,
      }}
    />
  );
}
