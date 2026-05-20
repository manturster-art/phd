import type { TypedSupabaseClient } from '@/lib/supabase/types';
import type { EventRow } from '@/lib/types/database';

export type Event = EventRow;

export async function listUpcomingEvents(
  supabase: TypedSupabaseClient,
  limit = 20
): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .is('deleted_at', null)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Event[];
}

export async function listEventsInRange(
  supabase: TypedSupabaseClient,
  fromIso: string,
  toIso: string
): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .is('deleted_at', null)
    .gte('starts_at', fromIso)
    .lt('starts_at', toIso)
    .order('starts_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Event[];
}

export async function getEvent(
  supabase: TypedSupabaseClient,
  id: string
): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return (data as Event | null) ?? null;
}

export interface CreateEventInput {
  title: string;
  description_md?: string | null;
  location?: string | null;
  starts_at: string;
  ends_at?: string | null;
  is_all_day?: boolean;
}

export async function createEvent(
  supabase: TypedSupabaseClient,
  input: CreateEventInput,
  authorId: string
): Promise<string> {
  const { data, error } = await (supabase.from('events') as any)
    .insert({ ...input, created_by: authorId })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function deleteEvent(
  supabase: TypedSupabaseClient,
  id: string
) {
  const { error } = await (supabase.from('events') as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
