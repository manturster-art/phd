// SCR-080 가입 승인 큐
import { redirect } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ApprovalRequestCard } from '@/components/admin/ApprovalRequestCard';
import { createClient } from '@/lib/supabase/server';
import { listPendingMembers } from '@/lib/api/members';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: '가입 승인 · 원우회' };

export default async function ApprovalsPage() {
  const profile = await getCurrentProfile();
  if (!isOfficer(profile)) redirect('/');
  const supabase = createClient();
  const list = await listPendingMembers(supabase).catch(() => []);

  return (
    <>
      <AppBar
        title={`가입 승인${list.length > 0 ? ` · ${list.length}건 대기` : ''}`}
        leading="back"
      />
      <div className="py-4">
        {list.length === 0 ? (
          <Card>
            <EmptyState icon="📭" title="현재 대기 중인 신청이 없습니다" />
          </Card>
        ) : (
          <Card>{list.map((r) => <ApprovalRequestCard key={r.id} request={r} />)}</Card>
        )}
      </div>
    </>
  );
}
