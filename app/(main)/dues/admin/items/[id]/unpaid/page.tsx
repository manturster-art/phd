// SCR-063 미납자 목록
import { notFound, redirect } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { UnpaidMemberItem } from '@/components/dues/UnpaidMemberItem';
import { createClient } from '@/lib/supabase/server';
import { getDuesTerm, listUnpaid, type UnpaidMember } from '@/lib/api/dues';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';
import { formatKRW } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

// v0.2 B-04: 정지/탈퇴/반려 회원의 미납 채권도 별도 섹션으로 표시.
function partition(list: UnpaidMember[]): {
  active: UnpaidMember[];
  inactive: UnpaidMember[];
} {
  const active: UnpaidMember[] = [];
  const inactive: UnpaidMember[] = [];
  for (const m of list) {
    if (m.member_status === 'active') active.push(m);
    else inactive.push(m);
  }
  return { active, inactive };
}

function statusLabel(s: UnpaidMember['member_status']): string {
  switch (s) {
    case 'rejected':
      return '반려';
    case 'suspended':
      return '정지';
    case 'withdrawn':
      return '탈퇴';
    case 'pending':
      return '대기';
    default:
      return '';
  }
}

export default async function UnpaidPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!isOfficer(profile)) redirect('/dues');
  const supabase = createClient();
  const term = await getDuesTerm(supabase, params.id);
  if (!term) notFound();
  const list = await listUnpaid(supabase, params.id, true).catch(() => []);
  const { active, inactive } = partition(list);

  return (
    <>
      <AppBar title={`미납자 · ${term.label}`} leading="back" />
      <div className="space-y-4 py-4">
        <div className="rounded-md bg-bg-subtle px-3 py-2 text-sm text-text-secondary">
          {list.length}명 미납 · {formatKRW(list.length * term.amount_krw)}
          {inactive.length > 0 && (
            <span className="ml-1 text-xs">
              (활동 {active.length}명, 비활동 {inactive.length}명)
            </span>
          )}
        </div>

        {list.length === 0 ? (
          <Card>
            <EmptyState
              icon="🎉"
              title="이 학기는 모든 회원이 납부 완료했습니다"
            />
          </Card>
        ) : (
          <>
            {/* 활동 회원 */}
            <section aria-labelledby="unpaid-active-heading">
              <h2
                id="unpaid-active-heading"
                className="mb-2 px-1 text-sm font-semibold text-text-primary"
              >
                활동 회원 ({active.length})
              </h2>
              {active.length === 0 ? (
                <Card>
                  <EmptyState title="활동 회원 중 미납자가 없습니다" />
                </Card>
              ) : (
                <Card>
                  {active.map((m) => (
                    <UnpaidMemberItem key={m.member_id} member={m} />
                  ))}
                </Card>
              )}
            </section>

            {/* 비활동 회원 (정지/탈퇴/반려) — 별도 섹션 */}
            {inactive.length > 0 && (
              <section aria-labelledby="unpaid-inactive-heading">
                <h2
                  id="unpaid-inactive-heading"
                  className="mb-2 px-1 text-sm font-semibold text-text-secondary"
                >
                  비활동 회원 ({inactive.length})
                </h2>
                <p className="mb-2 px-1 text-xs text-text-muted">
                  정지·탈퇴·반려 처리된 회원의 잔여 미납 채권입니다.
                </p>
                <Card>
                  {inactive.map((m) => (
                    <UnpaidMemberItem
                      key={m.member_id}
                      member={m}
                      badge={statusLabel(m.member_status)}
                    />
                  ))}
                </Card>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
