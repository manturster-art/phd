// SCR-051 데모 — 회비 항목 상세 (회원).
// BankRuleBanner + 상태 칩 + 입금 신고 CTA / 신고 시트 통합.
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { BankRuleBanner } from '@/components/dues/BankRuleBanner';
import { DuesStatusBadge } from '@/components/dues/DuesStatusBadge';
import { PaymentReportSheet } from '@/components/dues/PaymentReportSheet';
import { demoDuesDetails, currentDemoMember } from '@/lib/demo/mockData';
import { formatDateTime, formatKRW } from '@/lib/utils/format';
import type { DuesStatus } from '@/lib/types/database';

export default function DemoDuesMemberDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const detail = demoDuesDetails[params.id];
  const [open, setOpen] = useState(false);
  // 데모: 신고 후 상태 변경을 로컬에서 흉내냄 (서버 호출 없음).
  const [status, setStatus] = useState<DuesStatus>(
    (detail?.status ?? 'unpaid') as DuesStatus
  );
  const [reportedAt, setReportedAt] = useState<string | null>(
    detail?.reportedAt ?? null
  );
  const [reportedAmount, setReportedAmount] = useState<number | null>(
    detail?.reportedAmountKrw ?? null
  );

  const bankInfo = useMemo(
    () => ({
      bank: '우리은행',
      account: '1234-5678-901234',
      owner: '원우회 박현우',
    }),
    []
  );

  if (!detail) {
    return (
      <>
        <AppBar title="회비" leading="back" />
        <div className="py-12 text-center text-sm text-text-secondary">
          항목을 찾을 수 없어요.
          <div className="mt-4">
            <Link
              href="/demo/dues-member"
              className="text-primary-500 underline-offset-2 hover:underline"
            >
              회비 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </>
    );
  }

  const onSubmitReport = async (input: {
    reportedAt: string;
    reportedAmount: number;
    reportedMemo: string | null;
  }) => {
    // 데모: 1초 지연 후 상태 변경. 실제 호출은 lib/api/dues#reportMyDuesPayment.
    await new Promise((r) => setTimeout(r, 400));
    setStatus('pending_payment');
    setReportedAt(input.reportedAt);
    setReportedAmount(input.reportedAmount);
    setOpen(false);
    toast.show(
      '신고가 접수되었어요. 임원이 확인하면 알림으로 알려드릴게요.',
      'success'
    );
  };

  return (
    <>
      <AppBar title="회비" leading="back" />
      <div className="space-y-5 py-4">
        <header>
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            {detail.termLabel} 회비
          </h2>
          <p className="mt-1 text-base text-text-secondary">
            {formatKRW(detail.termAmountKrw)}
            {detail.termDueDate && ` · 마감 ${detail.termDueDate}`}
          </p>
        </header>

        <BankRuleBanner
          memberName={currentDemoMember.name}
          termLabel={detail.termLabel}
          bankInfo={bankInfo}
        />

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
            <div className="mt-3 space-y-1">
              <p className="text-sm text-text-secondary">
                {reportedAt && formatDateTime(reportedAt)} 신고 ·{' '}
                {formatKRW(reportedAmount)}
              </p>
              <p className="text-sm text-text-secondary">
                처리되면 알림으로 알려드릴게요.
              </p>
            </div>
          )}

          {status === 'rejected' && detail.rejectionReason && (
            <div className="mt-3 space-y-3">
              <p className="text-base text-text-primary">
                사유: &ldquo;{detail.rejectionReason}&rdquo;
              </p>
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
              {reportedAt && `${formatDateTime(reportedAt)} 입금 · `}
              {formatKRW(reportedAmount ?? detail.termAmountKrw)}
            </p>
          )}

          {status === 'exempt' && (
            <p className="mt-3 text-sm text-text-secondary">
              면제 처리되었습니다.
            </p>
          )}
        </section>

        <div className="text-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-primary-500 underline-offset-2 hover:underline"
          >
            ← 회비 목록으로
          </button>
        </div>
      </div>

      <PaymentReportSheet
        open={open}
        onClose={() => setOpen(false)}
        termLabel={detail.termLabel}
        termAmountKrw={detail.termAmountKrw}
        previousRejectionReason={
          status === 'rejected' ? detail.rejectionReason : null
        }
        onSubmit={onSubmitReport}
      />
    </>
  );
}
