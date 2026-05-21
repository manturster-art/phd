// SCR-051 회비 항목 상세 — 회원 액션(입금 신고/재신고) 클라이언트.
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { DuesStatusBadge } from '@/components/dues/DuesStatusBadge';
import { PaymentReportSheet } from '@/components/dues/PaymentReportSheet';
import { createClient } from '@/lib/supabase/client';
import { reportMyDuesPayment, cancelMyDuesReport } from '@/lib/api/dues';
import { formatDateTime, formatKRW } from '@/lib/utils/format';
import type { DuesStatus } from '@/lib/types/database';

interface Props {
  paymentId: string;
  status: DuesStatus;
  termLabel: string;
  termAmountKrw: number;
  reportedAt: string | null;
  reportedAmount: number | null;
  rejectionReason: string | null;
}

export function DuesDetailClient({
  paymentId,
  status,
  termLabel,
  termAmountKrw,
  reportedAt,
  reportedAmount,
  rejectionReason,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  // QA P1-1 (US-C04): 신고 취소 확인 다이얼로그 + 진행 상태.
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const onCancelReport = async () => {
    if (cancelling) return;
    setCancelling(true);
    try {
      const supabase = createClient();
      await cancelMyDuesReport(supabase, paymentId);
      toast.show('신고를 취소했어요.', 'info');
      setCancelOpen(false);
      router.refresh();
    } catch (e: unknown) {
      toast.show(
        e instanceof Error ? e.message : '신고 취소에 실패했어요',
        'error'
      );
    } finally {
      setCancelling(false);
    }
  };

  const onSubmit = async (input: {
    reportedAt: string;
    reportedAmount: number;
    reportedMemo: string | null;
  }) => {
    try {
      const supabase = createClient();
      const result = await reportMyDuesPayment(supabase, paymentId, input);
      // 가드 트리거에 의해 옛 값 복원될 수 있음 → 응답 status 검증.
      if (result.status !== 'pending_payment') {
        toast.show('신고가 반영되지 않았어요. 다시 시도해주세요.', 'error');
        return;
      }
      setOpen(false);
      toast.show(
        '신고가 접수되었어요. 임원이 확인하면 알림으로 알려드릴게요.',
        'success'
      );
      router.refresh();
    } catch (e: unknown) {
      toast.show(
        e instanceof Error ? e.message : '신고에 실패했어요',
        'error'
      );
    }
  };

  return (
    <section className="rounded-lg border border-border bg-surface px-4 py-4">
      <p className="text-sm font-semibold text-text-secondary">내 상태</p>
      <div className="mt-2">
        <DuesStatusBadge status={status} />
      </div>

      {status === 'unpaid' && (
        <>
          <p className="mt-4 text-sm text-text-secondary">
            계좌이체 후 아래 버튼을 눌러주세요
          </p>
          <Button
            variant="primary"
            fullWidth
            className="mt-3"
            onClick={() => setOpen(true)}
          >
            입금했어요
          </Button>
        </>
      )}

      {status === 'pending_payment' && (
        <div className="mt-3 space-y-3">
          <div className="space-y-1">
            {reportedAt && (
              <p className="text-sm text-text-secondary">
                {formatDateTime(reportedAt)} 신고 ·{' '}
                {formatKRW(reportedAmount ?? termAmountKrw)}
              </p>
            )}
            <p className="text-sm text-text-secondary">
              처리되면 알림으로 알려드릴게요.
            </p>
          </div>
          {/* QA P1-1 / US-C04: 회원이 본인 신고를 임원 처리 전에 취소. */}
          <Button
            variant="ghost"
            fullWidth
            onClick={() => setCancelOpen(true)}
            disabled={cancelling}
          >
            신고 취소
          </Button>
        </div>
      )}

      {status === 'rejected' && (
        <div className="mt-3 space-y-3">
          {rejectionReason && (
            <p className="text-base text-text-primary">
              사유: &ldquo;{rejectionReason}&rdquo;
            </p>
          )}
          <Button
            variant="primary"
            fullWidth
            onClick={() => setOpen(true)}
          >
            다시 신고하기
          </Button>
        </div>
      )}

      {status === 'paid' && (
        <p className="mt-3 text-sm text-text-secondary">
          {reportedAt
            ? `${formatDateTime(reportedAt)} 입금 · ${formatKRW(reportedAmount ?? termAmountKrw)}`
            : '납부 완료 처리되었어요.'}
        </p>
      )}

      <PaymentReportSheet
        open={open}
        onClose={() => setOpen(false)}
        termLabel={termLabel}
        termAmountKrw={termAmountKrw}
        previousRejectionReason={status === 'rejected' ? rejectionReason : null}
        onSubmit={onSubmit}
      />

      <ConfirmDialog
        open={cancelOpen}
        title="신고를 취소할까요?"
        message="신고를 취소하면 다시 미납 상태로 돌아갑니다."
        confirmLabel="신고 취소"
        cancelLabel="유지"
        danger
        onConfirm={onCancelReport}
        onCancel={() => setCancelOpen(false)}
      />
    </section>
  );
}
