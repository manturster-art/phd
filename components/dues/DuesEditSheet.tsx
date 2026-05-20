// C-430 DuesEditSheet
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import type { DuesMatrixRow } from '@/lib/api/dues';
import type { DuesStatus } from '@/lib/types/database';
import { createClient } from '@/lib/supabase/client';
import { updateDuesPayment } from '@/lib/api/dues';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

interface Props {
  open: boolean;
  row: DuesMatrixRow | null;
  termLabel: string;
  officerId: string;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: DuesStatus; label: string; tone: string }[] = [
  { value: 'paid', label: '✅ 납부', tone: 'success' },
  { value: 'unpaid', label: '❌ 미납', tone: 'danger' },
  { value: 'exempt', label: '⚪ 면제', tone: 'neutral' },
];

export function DuesEditSheet({ open, row, termLabel, officerId, onClose }: Props) {
  const [status, setStatus] = useState<DuesStatus>('unpaid');
  const [memo, setMemo] = useState('');
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (row) {
      setStatus(row.status);
      setMemo(row.memo ?? '');
    }
  }, [row]);

  const save = () => {
    if (!row) return;
    const supabase = createClient();
    startTransition(async () => {
      try {
        await updateDuesPayment(supabase, row.id, { status, memo: memo || null }, officerId);
        toast.show('저장되었어요', 'success');
        router.refresh();
        onClose();
      } catch {
        toast.show('저장에 실패했어요', 'error');
      }
    });
  };

  return (
    <Sheet open={open} onClose={onClose} title={`${row?.member?.name ?? ''} · ${termLabel}`}>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">상태</p>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={cn(
                  'min-h-[44px] flex-1 rounded-md border px-3 text-sm font-medium',
                  status === opt.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-border bg-surface text-text-secondary'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <TextArea
          label="메모 (선택)"
          rows={3}
          maxLength={500}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button onClick={save} loading={pending}>저장</Button>
        </div>
      </div>
    </Sheet>
  );
}
