// SCR-071 프로필 수정
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/utils/auth';
import { ProfileEditor } from './ProfileEditor';

export const metadata = { title: '프로필 수정 · 원우회' };

export default async function ProfileEditPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  return <ProfileEditor initial={{ id: profile.id, name: profile.name, lab: profile.lab, phone: profile.phone, email: profile.email, student_id: profile.student_id }} />;
}
