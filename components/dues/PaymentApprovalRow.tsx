// C-462 PaymentApprovalRow (SCR-064) — 임원이 입금 신고 1건을 컨펌/반려하는 행.
// Apple grammar: hairline border, 카드 그림자 0, pill CTA, 단일 Action Blue.
// "반려"는 ghost danger pill (border-danger + text-danger + 투명 배경).
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { formatDateTime, formatKRW } from '@/lib/utils/format';

export interface ApprovalReport {
  id: string;
  memberName: string;
  cohortYear: number | null;
  termLabel: string;
  termAmountKrw: number;
  reportedAmountKrw: number;
  reportedAt: string;
  reportedMemo: string | null;
}

interface Props {
  report: ApprovalReport;
  onApprove: (id: string) => Promise<void> | void;
  onReject: (id: string, reason: string) => Promise<void> | void;
}

export function PaymentApprovalRow({ report, onApprove, onReject }: Props) {
  const [processing, setProcessing] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [removed, setRemoved] = useState(false);

  const amountMismatch =
    report.reportedAmountKrw !== report.termAmountKrw;

  useEffect(() => {
    // 외부에서 props 가 새로 들어오면 reset
    setRemoved(false);
  }, [report.id]);

  const handleApprove = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      await onApprove(report.id);
      setRemoved(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectSubmit = async () => {
    const r = reason.trim();
    if (r.length < 1 || r.length > 200) return;
    setProcessing(true);
    try {
      await onReject(report.id, r);
      setRemoved(true);
      setRejectOpen(false);
      setReason('');
    } finally {
      setProcessing(false);
    }
  };

  if (removed) return null;

  return (
    <article
      role="group"
      aria-label={`${report.memberName} ${report.termLabel} ${formatKRW(report.reportedAmountKrw)} 신고. 확인 또는 반려하세요`}
      className="border-b border-border px-4 py-4 last:border-b-0 transition-opacity"
      style={{ opacity: processing ? 0.5 : 1 }}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-text-primary">
            {report.memberName}
            {report.cohortYear != null && (
              <span className="ml-2 text-sm font-normal text-text-secondary">
                · {report.cohortYear}학번
              </span>
            )}
          </p>
          <p className="mt-0.5 text-sm text-text-secondary">
            {report.termLabel} · {formatKRW(report.reportedAmountKrw)}
            <span className="ml-1 text-text-muted">
              · {formatDateTime(report.reportedAt)} 신고
            </span>
          </p>
        </div>
      </header>

      {amountMismatch && (
        <p className="mt-2 text-sm text-warning" role="note">
          ⚠ 항목 금액({formatKRW(report.termAmountKrw)})과 다릅니다
        </p>
      )}

      {report.reportedMemo && (
        <p className="mt-2 text-sm text-text-primary">
          메모: {report.reportedMemo}
        </p>
      )}

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setRejectOpen(true)}
          disabled={processing}
          className="min-h-[44px] min-w-[88px] rounded-pill border border-danger px-4 text-sm text-danger active:scale-95 transition-transform duration-fast ease-standard focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-40"
        >
          반려
        </button>
        <Button
          type="button"
          variant="primary"
          onClick={handleApprove}
          loading={processing && !rejectOpen}
        >
          확인
        </Button>
      </div>

      {rejectOpen && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="신고 반려 사유 입력"
        >
          <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text-primary">
              {report.memberName}님 신고 반려
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {report.termLabel} · {formatKRW(report.reportedAmountKrw)}
            </p>

            <div className="mt-4">
              <TextArea
                label="사유 (회원에게 표시됩니다)"
                required
                rows={3}
                maxLength={200}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예) 입금자명이 매칭되지 않습니다"
              />
              <p className="mt-1 text-right text-xs text-text-muted">
                {[...reason].length} / 200
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setRejectOpen(false);
                  setReason('');
                }}
                disabled={processing}
              >
                취소
              </Button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={
                  processing ||
                  reason.trim().length < 1 ||
                  reason.trim().length > 200
                }
                className="h-11 min-w-[88px] rounded-pill border border-danger px-5 text-sm text-danger active:scale-95 transition-transform duration-fast ease-standard focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-40"
              >
                반려
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESC 닫기는 ConfirmDialog 패턴을 활용하지 않고 별도 구현 — 아래는 사용처 hooks */}
      <UseEscapeToClose
        open={rejectOpen}
        onClose={() => {
          setRejectOpen(false);
          setReason('');
        }}
      />
    </article>
  );
}

// keydown ESC 처리. inline hook 컴포넌트로 격리 (트리거 행마다 useEffect 등록).
function UseEscapeToClose({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return null;
}

