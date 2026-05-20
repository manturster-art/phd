// SCR-022 공지 작성
import { redirect } from 'next/navigation';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';
import { NoticeEditor } from '../NoticeEditor';

export const metadata = { title: '공지 작성 · 원우회' };

export default async function NoticeNewPage() {
  const profile = await getCurrentProfile();
  if (!isOfficer(profile)) redirect('/notices');
  return <NoticeEditor mode="create" />;
}
