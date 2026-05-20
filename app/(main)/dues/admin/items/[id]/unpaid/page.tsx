// SCR-063 미납자 목록
import { notFound, redirect } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { UnpaidMemberItem } from '@/components/dues/UnpaidMemberItem';
import { createClient } from '@/lib/supabase/server';
import { getDuesTerm, listUnpaid } from '@/lib/api/dues';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';
import { formatKRW } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

export default async function UnpaidPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!isOfficer(profile)) redirect('/dues');
  const supabase = createClient();
  const term = await getDuesTerm(supabase, params.id);
  if (!term) notFound();
  const list = await listUnpaid(supabase, params.id).catch(() => []);

  return (
    <>
      <AppBar title={`미납자 · ${term.label}`} leading="back" />
      <div className="space-y-3 py-4">
        <div className="rounded-md bg-bg-subtle px-3 py-2 text-sm text-text-secondary">
          {list.length}명 미납 · {formatKRW(list.length * term.amount_krw)}
        </div>
        {list.length === 0 ? (
          <Card>
            <EmptyState
              icon="🎉"
              title="이 학기는 모든 회원이 납부 완료했습니다"
            />
          </Card>
        ) : (
          <Card>
            {list.map((m) => <UnpaidMemberItem key={m.member_id} member={m} />)}
          </Card>
        )}
      </div>
    </>
  );
}
