// SCR-062 회비 항목 수정/삭제
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDuesTerm } from '@/lib/api/dues';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';
import { DuesItemEditor } from '../DuesItemEditor';

export const dynamic = 'force-dynamic';

export default async function DuesItemDetailPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!isOfficer(profile)) redirect('/dues');
  const supabase = createClient();
  const term = await getDuesTerm(supabase, params.id);
  if (!term) notFound();
  return (
    <>
      <DuesItemEditor
        mode="edit"
        termId={term.id}
        initial={{
          label: term.label,
          amount_krw: term.amount_krw,
          due_date: term.due_date,
          description_md: term.description_md,
        }}
      />
      <div className="app-container pb-12">
        <Link
          href={`/dues/admin/items/${term.id}/unpaid`}
          className="block rounded-md bg-bg-subtle p-3 text-center text-sm font-medium text-text-primary"
        >
          미납자 목록 보기 →
        </Link>
      </div>
    </>
  );
}
