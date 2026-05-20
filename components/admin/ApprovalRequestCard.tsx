// C-501 ApprovalRequestCard
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TextField } from '@/components/ui/TextField';
import { createClient } from '@/lib/supabase/client';
import { approveMember, rejectMember } from '@/lib/api/members';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { formatDateShort } from '@/lib/utils/format';
import type { PendingMember } from '@/lib/api/members';

interface Props {
  request: PendingMember;
}

export function ApprovalRequestCard({ request }: Props) {
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const doApprove = () => {
    const supabase = createClient();
    startTransition(async () => {
      try {
        await approveMember(supabase, request.id);
        toast.show(`${request.name}님을 승인했어요`, 'success');
        router.refresh();
      } catch {
        toast.show('승인에 실패했어요', 'error');
      } finally {
        setConfirmApprove(false);
      }
    });
  };

  const doReject = () => {
    const supabase = createClient();
    startTransition(async () => {
      try {
        await rejectMember(supabase, request.id, rejectReason || '사유 미입력');
        toast.show(`${request.name}님 신청을 반려했어요`, 'success');
        router.refresh();
      } catch {
        toast.show('반려에 실패했어요', 'error');
      } finally {
        setRejectOpen(false);
      }
    });
  };

  return (
    <div className="border-b border-border px-4 py-4 last:border-b-0">
      <p className="text-base font-semibold">{request.name}</p>
      <p className="text-xs text-text-secondary">{request.email}</p>
      <p className="mt-1 text-xs text-text-secondary">
        학번 {request.student_id ?? '-'}
        {request.cohort_year != null && ` · ${request.cohort_year}학번`}
      </p>
      <p className="text-xs text-text-secondary">
        신청 {formatDateShort(request.created_at)}
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setRejectOpen(true)} disabled={pending}>
          반려
        </Button>
        <Button onClick={() => setConfirmApprove(true)} disabled={pending}>
          승인
        </Button>
      </div>

      <ConfirmDialog
        open={confirmApprove}
        title={`${request.name}님을 승인하시겠어요?`}
        message="승인 후에는 회원으로 활성화됩니다."
        onConfirm={doApprove}
        onCancel={() => setConfirmApprove(false)}
      />

      {rejectOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="w-full max-w-sm rounded-lg bg-surface p-5 shadow-lg">
            <h2 className="text-lg font-semibold">반려 사유 (선택)</h2>
            <div className="mt-3">
              <TextField
                placeholder="예: 학과 외 인원으로 확인"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRejectOpen(false)}>취소</Button>
              <Button variant="danger" onClick={doReject} loading={pending}>반려</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
