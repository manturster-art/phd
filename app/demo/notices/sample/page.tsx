// SCR-021 데모 — 공지 상세
import { notFound } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { Badge } from '@/components/ui/Badge';
import { getDemoNoticeDetail } from '@/lib/demo/mockData';
import { formatDateTime } from '@/lib/utils/format';

export const metadata = { title: '데모 · 공지 상세' };

export default function DemoNoticeDetailPage() {
  // 핀 공지(n-1) 를 샘플로 노출.
  const notice = getDemoNoticeDetail('n-1');
  if (!notice) notFound();

  return (
    <>
      <AppBar title="공지" leading="back" />
      <article className="py-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {notice.pinned && <Badge tone="warning">📌 핀</Badge>}
          <Badge tone="info">공지</Badge>
        </div>
        <h1 className="text-2xl font-bold leading-tight">{notice.title}</h1>
        <p className="mt-2 text-sm text-text-secondary">
          {notice.author?.name ?? '(탈퇴회원)'} ·{' '}
          {formatDateTime(notice.created_at)}
        </p>
        <div className="mt-6 whitespace-pre-wrap break-words text-base leading-relaxed text-text-primary">
          {notice.body_md}
        </div>
      </article>
    </>
  );
}
