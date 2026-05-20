// SCR-064 통합 — 임원 회비 관리 화면 상단에 입금 신고 컨펌 섹션을 노출.
// 데이터는 RSC에서 listPendingDuesPayments 호출로 prefetch 후 props 로 전달.
'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { PaymentApprovalRow } from '@/components/dues/PaymentApprovalRow';
import {
  approveDuesPayment,
  rejectDuesPayment,
  type PendingPaymentRow,
} from '@/lib/api/dues';

interface Props {
  pending: PendingPaymentRow[];
}

export function PendingApprovalsSection({ pending }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState(pending);
  const [, startTransition] = useTransition();

  const onApprove = async (id: string) => {
    try {
      await approveDuesPayment(id);
      setItems((p) => p.filter((r) => r.id !== id));
      toast.show('납부 처리 완료', 'success');
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      toast.show(e instanceof Error ? e.message : '실패', 'error');
    }
  };

  const onReject = async (id: string, reason: string) => {
    try {
      await rejectDuesPayment(id, reason);
      setItems((p) => p.filter((r) => r.id !== id));
      toast.show('반려되었어요', 'info');
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      toast.show(e instanceof Error ? e.message : '실패', 'error');
    }
  };

  return (
    <section aria-label="입금 신고 컨펌">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">
          입금 신고 컨펌
          {items.length > 0 && (
            <span className="ml-2 text-sm font-normal text-warning">
              {items.length}건 대기
            </span>
          )}
        </h2>
        <Link
          href="/dues/admin/transactions/upload"
          className="text-sm text-primary-500 underline-offset-2 hover:underline"
        >
          거래내역 업로드 →
        </Link>
      </div>
      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon="📭"
            title="대기 중인 신고가 없습니다"
            description='회원이 "입금했어요"를 누르면 여기에 표시됩니다.'
          />
        </Card>
      ) : (
        <Card>
          {items.map((r) => (
            <PaymentApprovalRow
              key={r.id}
              report={{
                id: r.id,
                memberName: r.member_name,
                cohortYear: r.cohort_year,
                termLabel: r.term_label,
                termAmountKrw: r.term_amount_krw,
                reportedAmountKrw: r.reported_amount,
                reportedAt: r.reported_at,
                reportedMemo: r.reported_memo,
              }}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </Card>
      )}
    </section>
  );
}
