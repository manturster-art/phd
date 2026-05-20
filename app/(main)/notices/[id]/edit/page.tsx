// SCR-022 공지 수정
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getNotice } from '@/lib/api/notices';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';
import { NoticeEditor } from '../../NoticeEditor';

export const dynamic = 'force-dynamic';

export default async function NoticeEditPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!isOfficer(profile)) redirect('/notices');
  const supabase = createClient();
  const notice = await getNotice(supabase, params.id);
  if (!notice) notFound();
  return (
    <NoticeEditor
      mode="edit"
      noticeId={notice.id}
      initial={{ title: notice.title, body_md: notice.body_md }}
    />
  );
}
