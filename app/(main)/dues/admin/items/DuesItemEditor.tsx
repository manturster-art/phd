'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TextArea } from '@/components/ui/TextArea';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import { createDuesTerm, updateDuesTerm, deleteDuesTerm } from '@/lib/api/dues';
import { useToast } from '@/components/ui/Toast';

interface Props {
  mode: 'create' | 'edit';
  termId?: string;
  initial?: {
    label: string;
    amount_krw: number;
    due_date: string | null;
    description_md: string | null;
  };
}

export function DuesItemEditor({ mode, termId, initial }: Props) {
  const [label, setLabel] = useState(initial?.label ?? '');
  const [amount, setAmount] = useState<string>(String(initial?.amount_krw ?? ''));
  const [dueDate, setDueDate] = useState<string>(initial?.due_date ?? '');
  const [desc, setDesc] = useState(initial?.description_md ?? '');
  const [pending, startTransition] = useTransition();
  const [confirmDel, setConfirmDel] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const submit = () => {
    if (!label.trim() || !amount) {
      toast.show('학기 라벨과 금액을 입력하세요', 'error');
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 0) {
      toast.show('올바른 금액을 입력하세요', 'error');
      return;
    }
    const supabase = createClient();
    startTransition(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('not_authenticated');
        const payload = {
          label: label.trim(),
          amount_krw: amt,
          due_date: dueDate || null,
          description_md: desc.trim() || null,
        };
        if (mode === 'create') {
          await createDuesTerm(supabase, payload, user.id);
        } else if (termId) {
          await updateDuesTerm(supabase, termId, payload);
        }
        toast.show('저장했어요', 'success');
        router.replace('/dues/admin/items');
        router.refresh();
      } catch (e: any) {
        toast.show(
          e?.code === '23505' ? '같은 학기 라벨이 이미 있어요' : '저장에 실패했어요',
          'error'
        );
      }
    });
  };

  const remove = () => {
    if (!termId) return;
    const supabase = createClient();
    startTransition(async () => {
      try {
        await deleteDuesTerm(supabase, termId);
        toast.show('삭제했어요', 'success');
        router.replace('/dues/admin/items');
        router.refresh();
      } catch {
        toast.show('삭제에 실패했어요', 'error');
      } finally {
        setConfirmDel(false);
      }
    });
  };

  return (
    <>
      <AppBar
        title={mode === 'create' ? '회비 항목 등록' : '회비 항목 수정'}
        leading="back"
        trailing={<Button size="sm" onClick={submit} loading={pending}>저장</Button>}
      />
      <div className="space-y-4 py-4">
        <TextField label="학기 라벨" required placeholder="2026-1학기" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} />
        <TextField label="금액 (원)" required type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <TextField label="납부 마감일 (선택)" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <TextArea label="설명/계좌 안내" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={4000} />

        {mode === 'edit' && (
          <div className="mt-8 rounded-md border border-danger/30 bg-danger-bg p-4">
            <p className="text-sm font-semibold text-danger">위험 영역</p>
            <p className="mt-1 text-xs text-text-secondary">삭제하면 관련 납부 행도 모두 사라집니다.</p>
            <Button variant="danger" className="mt-3" onClick={() => setConfirmDel(true)}>
              이 항목 삭제
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDel}
        title="회비 항목을 삭제하시겠어요?"
        message="관련된 모든 회원의 납부 기록이 함께 삭제됩니다."
        confirmLabel={pending ? '삭제 중...' : '삭제'}
        danger
        onConfirm={remove}
        onCancel={() => setConfirmDel(false)}
      />
    </>
  );
}
