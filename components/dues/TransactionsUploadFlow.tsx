// SCR-065 — CSV/XLSX 업로드 + 매칭 결과 검토 + 일괄 확정 흐름.
// 데모/운영 동일 동작. 데모 모드는 API 라우트가 모킹 응답을 반환.
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AppBar } from '@/components/layout/AppBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { useToast } from '@/components/ui/Toast';
import { TransactionUploadDropzone } from '@/components/dues/TransactionUploadDropzone';
import {
  TransactionReviewTable,
  type ReviewRow,
  type ReviewCandidate,
} from '@/components/dues/TransactionReviewTable';
import type {
  DuesMatchType,
  DuesSourceBank,
} from '@/lib/types/database';

const BANK_LABEL: Record<DuesSourceBank, string> = {
  kb: 'KB국민은행',
  shinhan: '신한은행',
  woori: '우리은행',
  kakaobank: '카카오뱅크',
  toss: '토스뱅크',
  unknown: '미인식 양식',
};

export function TransactionsUploadFlow() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [bank, setBank] = useState<DuesSourceBank | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [committing, setCommitting] = useState(false);

  const onFile = async (file: File) => {
    setBusy(true);
    setFileName(file.name);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/dues/admin/transactions/parse', {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        toast.show(`파싱 실패: ${e.error ?? res.status}`, 'error');
        return;
      }
      const json = await res.json();
      setBank(json.detectedBank as DuesSourceBank);
      const mapped: ReviewRow[] = (json.rows as Array<{
        rawPayerName: string;
        rawMemo: string | null;
        rawAmountKrw: number;
        rawTransactionDate: string;
        kind: 'auto' | 'multi' | 'none';
        matchType: DuesMatchType | null;
        candidates: Array<{
          paymentId: string;
          memberId: string;
          memberName: string;
          cohortYear: number | null;
          termId: string;
          termLabel: string;
          termAmountKrw: number;
          currentStatus: string;
          recommended?: boolean;
        }>;
        matchedPaymentId: string | null;
      }>).map((r, idx) => ({
        id: `${idx}-${r.rawPayerName}-${r.rawAmountKrw}`,
        rawPayerName: r.rawPayerName,
        rawMemo: r.rawMemo,
        rawAmountKrw: r.rawAmountKrw,
        rawTransactionDate: r.rawTransactionDate,
        kind: r.kind,
        matchType: r.matchType,
        candidates: r.candidates.map((c) => ({
          paymentId: c.paymentId,
          memberId: c.memberId,
          memberName: c.memberName,
          cohortYear: c.cohortYear,
          termLabel: c.termLabel,
          termAmountKrw: c.termAmountKrw,
          currentStatus: c.currentStatus as ReviewCandidate['currentStatus'],
          recommended: c.recommended,
        })),
        matchedPaymentId: r.matchedPaymentId,
      }));
      setRows(mapped);
    } finally {
      setBusy(false);
    }
  };

  const autoCount = rows.filter((r) => r.kind === 'auto').length;

  const onPickCandidate = (
    rowId: string,
    cand: ReviewCandidate,
    matchType: DuesMatchType
  ) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              kind: 'auto',
              matchType,
              candidates: [cand],
              matchedPaymentId: cand.paymentId,
            }
          : r
      )
    );
    toast.show('자동매칭으로 이동했어요', 'success');
  };

  const onCommit = async () => {
    if (autoCount === 0) {
      toast.show('확정할 자동매칭 거래가 없어요', 'info');
      return;
    }
    setCommitting(true);
    try {
      const payload = rows
        .filter((r) => r.kind === 'auto' && r.matchedPaymentId)
        .map((r) => ({
          matchType: (r.matchType ?? 'manual') as DuesMatchType,
          paymentId: r.matchedPaymentId!,
          sourceBank: bank ?? 'unknown',
          raw: {
            payerName: r.rawPayerName,
            memo: r.rawMemo,
            amount: r.rawAmountKrw,
            transactionDate: r.rawTransactionDate.slice(0, 10),
          },
        }));
      const res = await fetch('/api/dues/admin/transactions/commit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rows: payload }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        toast.show(`확정 실패: ${e.error ?? res.status}`, 'error');
        return;
      }
      const json = await res.json();
      toast.show(
        `${json.ok}건 납부 처리 완료 · 업로드한 파일은 폐기되었습니다.`,
        'success'
      );
      setRows([]);
      setBank(null);
      setFileName(null);
    } finally {
      setCommitting(false);
    }
  };

  const onDiscard = () => {
    if (
      window.confirm(
        '검토를 중단하면 업로드한 파일과 매칭 결과가 폐기됩니다. 계속할까요?'
      )
    ) {
      setRows([]);
      setBank(null);
      setFileName(null);
    }
  };

  return (
    <>
      <AppBar title="거래내역 업로드" leading="back" />
      <div className="space-y-5 py-4 pb-32">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>지원 은행: KB · 신한 · 우리 · 카카오뱅크 · 토스</span>
          <Link
            href="#guide"
            className="text-primary-500 underline-offset-2 hover:underline"
          >
            지원 양식 자세히 →
          </Link>
        </div>

        {rows.length === 0 ? (
          <>
            <TransactionUploadDropzone
              accept={['.csv', '.xlsx']}
              maxSizeBytes={2 * 1024 * 1024}
              maxRows={1000}
              onFile={onFile}
              disabled={busy}
            />
            <InfoBanner>
              업로드한 파일은 매칭 처리 후 즉시 폐기되며 서버에 저장되지 않습니다.
            </InfoBanner>
            {busy && (
              <p className="text-center text-sm text-text-secondary">
                파일을 분석 중이에요…
              </p>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Badge tone="success">
                ✅ {bank ? BANK_LABEL[bank] : '미상'} 양식으로 인식됨
              </Badge>
              <p className="text-sm text-text-secondary">
                {fileName} · {rows.length}건
              </p>
              <button
                type="button"
                onClick={onDiscard}
                className="ml-auto text-xs text-primary-500 underline-offset-2 hover:underline"
              >
                다른 파일 선택
              </button>
            </div>

            <TransactionReviewTable
              rows={rows}
              onPickCandidate={onPickCandidate}
            />
          </>
        )}

        <section
          id="guide"
          className="rounded-lg border border-border bg-bg-subtle p-4 text-sm text-text-secondary"
        >
          <p className="font-semibold text-text-primary">지원 은행 양식</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>KB국민은행 — 인터넷뱅킹 거래내역 (CSV)</li>
            <li>신한은행 — SOL 거래내역 (CSV)</li>
            <li>우리은행 — 거래내역 조회 (XLSX)</li>
            <li>카카오뱅크 — 거래내역 (CSV)</li>
            <li>토스뱅크 — 거래내역 (XLSX)</li>
          </ul>
          <p className="mt-3 text-warning">
            ⚠ 본 앱은 매칭 후 원본을 즉시 폐기하며, 매칭 로그에는 입금자명·메모·금액만 남깁니다.
          </p>
        </section>
      </div>

      {rows.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-bottomBar border-t border-border bg-surface/95 px-4 pt-3 backdrop-blur"
          style={{ paddingBottom: 'calc(16px + var(--sab, 0px))' }}
        >
          <div className="mx-auto max-w-app">
            <p className="text-xs text-text-secondary">
              ⓘ 파일은 처리 후 폐기됩니다 · 자동매칭 {autoCount}건만 확정됩니다
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onDiscard}
                disabled={committing}
                className="h-11 min-w-[88px] rounded-pill border border-danger px-4 text-sm text-danger active:scale-95 transition-transform disabled:opacity-40"
              >
                폐기
              </button>
              <Button
                variant="primary"
                fullWidth
                loading={committing}
                onClick={onCommit}
                disabled={autoCount === 0}
              >
                {autoCount}건 일괄 확정
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
