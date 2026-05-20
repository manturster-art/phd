// C-461 PaymentReportSheet (SCR-052) — 회원이 입금 신고를 제출하는 BottomSheet.
// react-hook-form + zod 로 폼 검증. 키패드 올라온 상태에서도 "신고 제출" 버튼이
// 가시되도록 sticky 하단 액션바를 둔다. Apple grammar: pill CTA, scale-95.
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TextArea } from '@/components/ui/TextArea';
import { formatKRW } from '@/lib/utils/format';

export interface PaymentReportInput {
  reportedAt: string;
  reportedAmount: number;
  reportedMemo: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  termLabel: string;
  termAmountKrw: number;
  previousRejectionReason?: string | null;
  onSubmit: (input: PaymentReportInput) => Promise<void> | void;
}

// datetime-local 표시용 (KST 가정, Z 변환 없이 로컬 그대로 입력) → 제출 시 ISO 변환.
function toLocalDateTimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

// 한국어 안전 zod 메시지.
const schema = z.object({
  reportedAt: z
    .string()
    .min(1, '입금 일시를 입력해주세요')
    .refine((v) => !Number.isNaN(new Date(v).getTime()), '올바른 일시가 아니에요'),
  reportedAmount: z
    .number({ invalid_type_error: '금액을 숫자로 입력해주세요' })
    .int('소수는 사용할 수 없어요')
    .nonnegative('0원 이상으로 입력해주세요')
    .max(1_000_000_000, '금액이 너무 큽니다'),
  reportedMemo: z
    .string()
    .max(200, '메모는 200자 이내로 입력해주세요')
    .optional(),
});

type FormValues = z.infer<typeof schema>;

export function PaymentReportSheet({
  open,
  onClose,
  termLabel,
  termAmountKrw,
  previousRejectionReason,
  onSubmit,
}: Props) {
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const defaultReportedAt = useMemo(() => toLocalDateTimeValue(new Date()), []);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reportedAt: defaultReportedAt,
      reportedAmount: termAmountKrw,
      reportedMemo: '',
    },
  });

  // 열릴 때마다 폼 리셋 (이전 입력 잔존 방지) + 첫 입력 포커스.
  useEffect(() => {
    if (!open) return;
    reset({
      reportedAt: toLocalDateTimeValue(new Date()),
      reportedAmount: termAmountKrw,
      reportedMemo: '',
    });
    const t = setTimeout(() => firstFieldRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [open, termAmountKrw, reset]);

  const watchAmount = watch('reportedAmount');
  const amountDiff =
    typeof watchAmount === 'number' &&
    !Number.isNaN(watchAmount) &&
    watchAmount !== termAmountKrw;

  const onValid = async (values: FormValues) => {
    const isoReportedAt = new Date(values.reportedAt).toISOString();
    await onSubmit({
      reportedAt: isoReportedAt,
      reportedAmount: Math.round(values.reportedAmount),
      reportedMemo: values.reportedMemo?.trim() || null,
    });
  };

  // register("reportedAt") 와 ref 합치기 위한 헬퍼.
  const reportedAtReg = register('reportedAt');

  return (
    <Sheet open={open} onClose={onClose} title="입금 신고">
      <p className="-mt-3 mb-4 text-sm text-text-secondary">
        {termLabel} · {formatKRW(termAmountKrw)}
      </p>

      {previousRejectionReason && (
        <div
          className="mb-4 rounded-lg bg-bg px-4 py-3 text-sm text-text-secondary"
          aria-label="이전 반려 사유"
        >
          <p className="font-semibold text-text-primary">이전 반려 사유</p>
          <p className="mt-1">{previousRejectionReason}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onValid)}
        className="space-y-4"
        noValidate
      >
        <TextField
          label="입금 일시"
          required
          type="datetime-local"
          {...reportedAtReg}
          ref={(el) => {
            reportedAtReg.ref(el);
            firstFieldRef.current = el;
          }}
          error={errors.reportedAt?.message}
        />

        <TextField
          label="금액 (원)"
          required
          type="number"
          inputMode="numeric"
          {...register('reportedAmount', { valueAsNumber: true })}
          rightSlot={<span className="text-sm text-text-muted">원</span>}
          error={errors.reportedAmount?.message}
          hint={
            amountDiff
              ? `⚠ 항목 금액(${formatKRW(termAmountKrw)})과 다릅니다. 부분/초과 납부로 신고됩니다.`
              : undefined
          }
        />

        <TextArea
          label="메모 (선택)"
          rows={2}
          maxLength={200}
          placeholder="예) 4월 10일 입금"
          {...register('reportedMemo')}
          error={errors.reportedMemo?.message}
        />

        <div className="-mx-6 mt-2 flex items-center gap-2 border-t border-border bg-surface px-6 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isSubmitting}
          >
            신고 제출
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
