// SCR-021 공지 상세
import { notFound } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { createClient } from '@/lib/supabase/server';
import { getNotice } from '@/lib/api/notices';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';
import { formatDateTime } from '@/lib/utils/format';
import { NoticeMenu } from './NoticeMenu';

export const dynamic = 'force-dynamic';

export default async function NoticeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  const notice = await getNotice(supabase, params.id);
  if (!notice) notFound();

  return (
    <>
      <AppBar
        title="공지"
        leading="back"
        trailing={isOfficer(profile) ? <NoticeMenu noticeId={notice.id} /> : null}
      />
      <article className="py-5">
        <h1 className="text-2xl font-bold leading-tight">{notice.title}</h1>
        <p className="mt-2 text-sm text-text-secondary">
          {notice.author?.name ?? '(탈퇴회원)'} · {formatDateTime(notice.created_at)}
        </p>
        <div className="mt-6 whitespace-pre-wrap break-words text-base leading-relaxed text-text-primary">
          {notice.body_md}
        </div>
      </article>
    </>
  );
}
