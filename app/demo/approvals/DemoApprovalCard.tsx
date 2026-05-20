// 데모 가입 승인 카드. 승인/반려는 alert 만 노출.
'use client';

import { Button } from '@/components/ui/Button';
import { formatDateShort } from '@/lib/utils/format';
import type { PendingMember } from '@/lib/api/members';

export function DemoApprovalCard({ request }: { request: PendingMember }) {
  return (
    <div className="border-b border-border px-4 py-4 last:border-b-0">
      <p className="text-base font-semibold">{request.name}</p>
      <p className="text-xs text-text-secondary">{request.email}</p>
      <p className="mt-1 text-xs text-text-secondary">
        학번 {request.student_id ?? '-'}
        {request.cohort_year != null && ` · ${request.cohort_year}학번`}
      </p>
      {request.lab && (
        <p className="text-xs text-text-secondary">{request.lab}</p>
      )}
      <p className="text-xs text-text-secondary">
        신청 {formatDateShort(request.created_at)}
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() =>
            alert(`[데모] ${request.name} 신청을 반려합니다.`)
          }
        >
          반려
        </Button>
        <Button
          onClick={() => alert(`[데모] ${request.name} 신청을 승인합니다.`)}
        >
          승인
        </Button>
      </div>
    </div>
  );
}
