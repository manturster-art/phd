// SCR-061 회비 항목 목록 (임원)
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FAB } from '@/components/layout/FAB';
import { DuesItemCard } from '@/components/dues/DuesItemCard';
import { createClient } from '@/lib/supabase/server';
import { listDuesTerms } from '@/lib/api/dues';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';

export const metadata = { title: '회비 항목 · 원우회' };

export default async function DuesItemsPage() {
  const profile = await getCurrentProfile();
  if (!isOfficer(profile)) redirect('/dues');
  const supabase = createClient();
  const terms = await listDuesTerms(supabase).catch(() => []);

  // 각 항목의 미납자 수: 간단 카운트 쿼리 (P0)
  const counts: Record<string, number> = {};
  await Promise.all(
    terms.map(async (t) => {
      const { count } = await supabase
        .from('dues_payment')
        .select('id', { count: 'exact', head: true })
        .eq('dues_term_id', t.id)
        .eq('status', 'unpaid');
      counts[t.id] = count ?? 0;
    })
  );

  return (
    <>
      <AppBar title="회비 항목" leading="back" />
      <div className="py-4">
        {terms.length === 0 ? (
          <Card><EmptyState icon="💰" title="아직 회비 항목이 없습니다" /></Card>
        ) : (
          <Card>{terms.map((t) => (
            <DuesItemCard key={t.id} term={t} unpaidCount={counts[t.id]} />
          ))}</Card>
        )}
      </div>
      <FAB href="/dues/admin/items/new" label="항목 추가" icon="➕" />
    </>
  );
}
