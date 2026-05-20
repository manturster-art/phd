// SCR-051 회비 항목 상세 (회원). RSC + 시트만 client.
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { BankRuleBanner } from '@/components/dues/BankRuleBanner';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/utils/auth';
import { formatKRW } from '@/lib/utils/format';
import { DuesDetailClient } from './DuesDetailClient';
import type { DuesStatus } from '@/lib/types/database';

export const dynamic = 'force-dynamic';
export const metadata = { title: '회비 항목 · 원우회' };

export default async function DuesDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  const supabase = createClient();
  // dues_payment_member_view 로 조회 (memo 마스킹 보장)
  const { data, error } = await (supabase as any)
    .from('dues_payment_member_view')
    .select(
      'id, status, paid_at, memo, memo_public, reported_at, reported_amount, ' +
        'reported_memo, rejection_reason, dues_term:dues_term_id(id, label, amount_krw, due_date, description_md)'
    )
    .eq('id', params.id)
    .maybeSingle();
  if (error || !data) {
    return (
      <>
        <AppBar title="회비" leading="back" />
        <div className="py-12 text-center text-sm text-text-secondary">
          항목을 찾을 수 없어요.
          <div className="mt-4">
            <Link href="/dues" className="text-primary-500 underline-offset-2 hover:underline">
              회비 목록으로
            </Link>
          </div>
        </div>
      </>
    );
  }
  type Row = {
    id: string;
    status: DuesStatus;
    paid_at: string | null;
    memo: string | null;
    memo_public: boolean;
    reported_at: string | null;
    reported_amount: number | null;
    reported_memo: string | null;
    rejection_reason: string | null;
    dues_term: {
      id: string;
      label: string;
      amount_krw: number;
      due_date: string | null;
      description_md: string | null;
    } | null;
  };
  const row = data as unknown as Row;
  const term = row.dues_term;
  if (!term) {
    return redirect('/dues');
  }

  return (
    <>
      <AppBar title="회비" leading="back" />
      <div className="space-y-5 py-4">
        <header>
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            {term.label} 회비
          </h2>
          <p className="mt-1 text-base text-text-secondary">
            {formatKRW(term.amount_krw)}
            {term.due_date && ` · 마감 ${term.due_date}`}
          </p>
        </header>

        <BankRuleBanner
          memberName={profile.name}
          termLabel={term.label}
          bankInfo={{
            bank: '계좌 정보',
            account: term.description_md ?? '항목 설명에서 확인',
            owner: '',
          }}
        />

        <DuesDetailClient
          paymentId={row.id}
          status={row.status}
          termLabel={term.label}
          termAmountKrw={term.amount_krw}
          reportedAt={row.reported_at}
          reportedAmount={row.reported_amount}
          rejectionReason={row.rejection_reason}
        />
      </div>
    </>
  );
}
