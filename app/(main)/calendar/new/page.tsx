// SCR-042 일정 등록
import { redirect } from 'next/navigation';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';
import { EventEditor } from './EventEditor';

export const metadata = { title: '일정 등록 · 원우회' };

export default async function NewEventPage() {
  const profile = await getCurrentProfile();
  if (!isOfficer(profile)) redirect('/calendar');
  return <EventEditor />;
}
