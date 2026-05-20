// SCR-080 데모 — 가입 승인 큐 (임원)
import { AppBar } from '@/components/layout/AppBar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { DemoApprovalCard } from './DemoApprovalCard';
import { demoPendingMembers } from '@/lib/demo/mockData';

export const metadata = { title: '데모 · 가입 승인' };

export default function DemoApprovalsPage() {
  const list = demoPendingMembers;

  return (
    <>
      <AppBar
        title={`가입 승인${list.length > 0 ? ` · ${list.length}건 대기` : ''}`}
        leading="back"
      />
      <div className="space-y-3 py-4">
        <div className="flex items-center gap-2">
          <Badge tone="warning">임원 권한 미리보기</Badge>
          <p className="text-xs text-text-secondary">
            실제 환경에서는 임원/관리자만 접근 가능합니다.
          </p>
        </div>
        {list.length === 0 ? (
          <Card>
            <EmptyState icon="📭" title="현재 대기 중인 신청이 없습니다" />
          </Card>
        ) : (
          <Card>
            {list.map((r) => (
              <DemoApprovalCard key={r.id} request={r} />
            ))}
          </Card>
        )}
      </div>
    </>
  );
}
