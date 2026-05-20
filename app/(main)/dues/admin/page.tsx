// SCR-060 납부 현황 매트릭스 (임원)
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { listDuesTerms, listDuesMatrix } from '@/lib/api/dues';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';
import { DuesAdminClient } from './DuesAdminClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: '회비 관리 · 원우회' };

export default async function DuesAdminPage({
  searchParams,
}: {
  searchParams?: { term?: string };
}) {
  const profile = await getCurrentProfile();
  if (!isOfficer(profile) || !profile) redirect('/dues');
  const supabase = createClient();
  const terms = await listDuesTerms(supabase).catch(() => []);
  const activeTermId = searchParams?.term ?? terms[0]?.id ?? null;
  const matrix = activeTermId ? await listDuesMatrix(supabase, activeTermId).catch(() => []) : [];

  return (
    <>
      <AppBar
        title="회비 관리"
        leading="back"
        trailing={
          <Link
            href="/dues/admin/items"
            className="rounded-pill border border-primary-500 px-4 py-1.5 text-xs font-normal text-primary-500 active:scale-95 transition-transform"
          >
            항목 관리
          </Link>
        }
      />
      <div className="py-4">
        {terms.length === 0 ? (
          <Card>
            <EmptyState
              icon="💰"
              title="아직 회비 항목이 없습니다"
              description="먼저 항목을 등록해주세요."
            />
          </Card>
        ) : (
          <DuesAdminClient
            terms={terms}
            activeTermId={activeTermId!}
            matrix={matrix}
            officerId={profile.id}
          />
        )}
      </div>
    </>
  );
}
