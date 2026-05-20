// POST /api/dues/admin/transactions/parse
// CSV/XLSX 파싱 + 매칭 후보 계산. 원본은 메모리에서만 처리되고 즉시 폐기.
// 06_backend §4.5.
//
// 데모 모드: profile/dues_payment 조회를 mock 데이터로 대체.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';
import { isDemoMode } from '@/lib/dues/demo-mode';
import { parseFile } from '@/lib/dues/csv-parser';
import {
  runMatcher,
  type CandidateMember,
  type CandidatePayment,
} from '@/lib/dues/matcher';

export const runtime = 'nodejs';
// 메모리 처리 보장 — Edge runtime 의 streaming 대신 Node 사용.
export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_ROWS = 1000;

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 });
  }
  const file = formData.get('file');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'file_required' }, { status: 400 });
  }
  // Blob 은 Web standard. File 인 경우만 name 접근 가능.
  const name =
    typeof (file as File).name === 'string' ? (file as File).name : 'upload';
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: 'file_too_large', limit: MAX_FILE_BYTES },
      { status: 413 }
    );
  }

  let parsed;
  try {
    parsed = await parseFile(file, name);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'parse_failed' },
      { status: 400 }
    );
  }
  if (parsed.totalRows > MAX_ROWS) {
    return NextResponse.json(
      { error: 'too_many_rows', limit: MAX_ROWS },
      { status: 413 }
    );
  }

  // 회원/미납 매칭용 데이터 로드
  let members: CandidateMember[] = [];
  let unpaidByMember: Record<string, CandidatePayment[]> = {};

  if (isDemoMode()) {
    const mock = await import('@/lib/demo/mockData');
    members = mock.demoMembers.map((m) => ({
      id: m.id,
      name: m.name,
      cohortYear: m.cohort_year,
    }));
    const unpaid = mock.demoDuesMatrix.filter(
      (r) => r.status === 'unpaid' || r.status === 'rejected'
    );
    const term = mock.demoDuesTerms[0];
    for (const r of unpaid) {
      if (!r.member) continue;
      const arr = unpaidByMember[r.member.id] ?? [];
      arr.push({
        paymentId: r.id,
        memberId: r.member.id,
        memberName: r.member.name,
        cohortYear: r.member.cohort_year,
        termId: term.id,
        termLabel: term.label,
        termAmountKrw: term.amount_krw,
        termDueDate: term.due_date,
        currentStatus: r.status,
      });
      unpaidByMember[r.member.id] = arr;
    }
  } else {
    const profile = await getCurrentProfile();
    if (!isOfficer(profile)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const supabase = createClient();

    // 모든 회원 (active 이상 — 정지/탈퇴/반려 포함은 매칭 도우미용)
    const { data: prof, error: pErr } = await supabase
      .from('profiles')
      .select('id, name, cohort_year, status')
      .in('status', ['active', 'suspended', 'withdrawn', 'rejected']);
    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }
    members = ((prof ?? []) as unknown as Array<{
      id: string;
      name: string;
      cohort_year: number | null;
    }>).map((p) => ({ id: p.id, name: p.name, cohortYear: p.cohort_year }));

    // 미납 + 반려 + 검토중 (CSV 매칭으로도 paid 전이 가능)
    const { data: pays, error: payErr } = await supabase
      .from('dues_payment')
      .select(
        'id, member_id, status, dues_term:dues_term_id(id, label, amount_krw, due_date), ' +
          'member:profiles!member_id(name, cohort_year)'
      )
      .in('status', ['unpaid', 'rejected', 'pending_payment']);
    if (payErr) {
      return NextResponse.json({ error: payErr.message }, { status: 500 });
    }
    type PayRow = {
      id: string;
      member_id: string;
      status: string;
      dues_term: {
        id: string;
        label: string;
        amount_krw: number;
        due_date: string | null;
      } | null;
      member: { name: string; cohort_year: number | null } | null;
    };
    for (const p of (pays ?? []) as unknown as PayRow[]) {
      if (!p.dues_term || !p.member) continue;
      const arr = unpaidByMember[p.member_id] ?? [];
      arr.push({
        paymentId: p.id,
        memberId: p.member_id,
        memberName: p.member.name,
        cohortYear: p.member.cohort_year,
        termId: p.dues_term.id,
        termLabel: p.dues_term.label,
        termAmountKrw: p.dues_term.amount_krw,
        termDueDate: p.dues_term.due_date,
        currentStatus: p.status as CandidatePayment['currentStatus'],
      });
      unpaidByMember[p.member_id] = arr;
    }
  }

  const matched = runMatcher({
    transactions: parsed.rows,
    members,
    unpaidByMember,
  });

  // 원본 데이터 폐기 (참조 해제)
  parsed.rows.length = 0;

  return NextResponse.json({
    detectedBank: parsed.detectedBank,
    totalRows: matched.length,
    skippedLines: parsed.skippedLines,
    rows: matched,
  });
}
