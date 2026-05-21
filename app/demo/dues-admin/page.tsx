// SCR-060 + SCR-064 데모 — 회비 매트릭스 + 입금 신고 컨펌 통합.
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AppBar } from '@/components/layout/AppBar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { DemoDuesAdminClient } from './DemoDuesAdminClient';
import { PaymentApprovalRow } from '@/components/dues/PaymentApprovalRow';
import {
  demoDuesTerms,
  demoDuesMatrix,
  demoPendingPayments,
} from '@/lib/demo/mockData';

export default function DemoDuesAdminPage() {
  const toast = useToast();
  const [pending, setPending] = useState(demoPendingPayments);

  // QA P1-4 (데모): 컨펌/반려 후 5초간 [실행취소] 토스트.
  const undo = (row: (typeof demoPendingPayments)[number]) => {
    setPending((prev) => (prev.find((p) => p.id === row.id) ? prev : [row, ...prev]));
    toast.show('처리를 취소했어요.', 'info');
  };

  const onApprove = (id: string) => {
    const row = pending.find((r) => r.id === id);
    setPending((p) => p.filter((r) => r.id !== id));
    if (row) {
      toast.show('납부 처리 완료', 'success', {
        action: { label: '실행취소', onClick: () => undo(row) },
        durationMs: 5000,
      });
    } else {
      toast.show('납부 처리 완료', 'success');
    }
  };
  const onReject = (id: string, reason: string) => {
    const row = pending.find((r) => r.id === id);
    setPending((p) => p.filter((r) => r.id !== id));
    if (row) {
      toast.show(`반려되었어요: ${reason.slice(0, 20)}…`, 'info', {
        action: { label: '실행취소', onClick: () => undo(row) },
        durationMs: 5000,
      });
    } else {
      toast.show(`반려되었어요: ${reason.slice(0, 20)}…`, 'info');
    }
  };

  return (
    <>
      <AppBar
        title="회비 관리"
        leading="back"
        trailing={
          <Link
            href="/demo/dues-member"
            className="rounded-pill border border-primary-500 px-4 py-1.5 text-xs font-normal text-primary-500 active:scale-95 transition-transform"
          >
            회원 모드 →
          </Link>
        }
      />
      <div className="space-y-5 py-4">
        <div className="flex items-center gap-2">
          <Badge tone="warning">임원 권한 미리보기</Badge>
          <p className="text-xs text-text-secondary">
            실제 환경에서는 임원/관리자만 접근 가능합니다.
          </p>
        </div>

        {/* v0.3 신규 — 입금 신고 컨펌 섹션 (SCR-064) */}
        <section aria-label="입금 신고 컨펌">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">
              입금 신고 컨펌
              {pending.length > 0 && (
                <span className="ml-2 text-sm font-normal text-warning">
                  {pending.length}건 대기
                </span>
              )}
            </h2>
            <Link
              href="/demo/dues-admin/transactions/upload"
              className="text-sm text-primary-500 underline-offset-2 hover:underline"
            >
              거래내역 업로드 →
            </Link>
          </div>
          {pending.length === 0 ? (
            <Card>
              <EmptyState
                icon="📭"
                title="대기 중인 신고가 없습니다"
                description='회원이 "입금했어요"를 누르면 여기에 표시됩니다.'
              />
            </Card>
          ) : (
            <Card>
              {pending.map((r) => (
                <PaymentApprovalRow
                  key={r.id}
                  report={{
                    id: r.id,
                    memberName: r.memberName,
                    cohortYear: r.cohortYear,
                    termLabel: r.termLabel,
                    termAmountKrw: r.termAmountKrw,
                    reportedAmountKrw: r.reportedAmountKrw,
                    reportedAt: r.reportedAt,
                    reportedMemo: r.reportedMemo,
                  }}
                  onApprove={onApprove}
                  onReject={onReject}
                />
              ))}
            </Card>
          )}
        </section>

        {/* 기존 매트릭스 */}
        <section aria-label="회비 매트릭스">
          <h2 className="mb-2 text-base font-semibold text-text-primary">
            납부 매트릭스
          </h2>
          <DemoDuesAdminClient terms={demoDuesTerms} matrix={demoDuesMatrix} />
        </section>
      </div>
    </>
  );
}
