// C-440 UnpaidMemberItem
'use client';

import { useToast } from '@/components/ui/Toast';
import type { UnpaidMember } from '@/lib/api/dues';

interface Props {
  member: UnpaidMember;
}

export function UnpaidMemberItem({ member }: Props) {
  const toast = useToast();
  return (
    <div className="border-b border-border px-4 py-3 last:border-b-0">
      <p className="text-sm font-semibold text-text-primary">
        {member.name}
        {member.cohort_year != null && (
          <span className="ml-2 text-xs text-text-secondary">· {member.cohort_year}학번</span>
        )}
      </p>
      {member.lab && (
        <p className="mt-0.5 text-xs text-text-secondary">{member.lab}</p>
      )}
      {member.phone && (
        <div className="mt-1 flex items-center gap-3">
          <a href={`tel:${member.phone}`} className="text-xs text-primary-600 hover:underline">
            📞 {member.phone}
          </a>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard?.writeText(member.phone ?? '');
                toast.show('연락처 복사', 'success');
              } catch {
                toast.show('복사 실패', 'error');
              }
            }}
            className="text-xs text-text-secondary hover:underline"
          >
            📋 복사
          </button>
        </div>
      )}
    </div>
  );
}
