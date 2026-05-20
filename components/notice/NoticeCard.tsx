// C-301 NoticeCard
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { formatRelative } from '@/lib/utils/format';
import type { NoticeListItem } from '@/lib/api/notices';

interface Props {
  notice: NoticeListItem;
}

export function NoticeCard({ notice }: Props) {
  return (
    <Link
      href={`/notices/${notice.id}`}
      className="block border-b border-border px-4 py-3 last:border-b-0 hover:bg-bg-subtle"
    >
      <div className="flex items-center gap-2">
        {notice.pinned && <Badge tone="warning">📌 핀</Badge>}
        <Badge tone="info">공지</Badge>
        <h3 className="flex-1 truncate text-sm font-semibold text-text-primary">
          {notice.title}
        </h3>
      </div>
      <p className="mt-1 text-xs text-text-secondary">
        {notice.author?.name ?? '(탈퇴회원)'} · {formatRelative(notice.created_at)}
      </p>
    </Link>
  );
}
