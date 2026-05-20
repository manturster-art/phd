// SCR-065 거래내역 업로드 (임원). 데모와 거의 동일하지만 권한 가드만 추가.
import { redirect } from 'next/navigation';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';
import { TransactionsUploadClient } from './TransactionsUploadClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: '거래내역 업로드 · 원우회' };

export default async function TransactionsUploadPage() {
  const profile = await getCurrentProfile();
  if (!isOfficer(profile)) redirect('/dues');
  return <TransactionsUploadClient />;
}
