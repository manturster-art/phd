// SCR-062 회비 항목 생성
import { redirect } from 'next/navigation';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';
import { DuesItemEditor } from '../DuesItemEditor';

export const metadata = { title: '회비 항목 등록 · 원우회' };

export default async function NewDuesItemPage() {
  const profile = await getCurrentProfile();
  if (!isOfficer(profile)) redirect('/dues');
  return <DuesItemEditor mode="create" />;
}
