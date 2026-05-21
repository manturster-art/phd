// =====================================================================
// lib/dues/matcher.ts
// CSV 거래내역 ↔ dues_payment 매칭 알고리즘.
// 백엔드 명세 (06_backend §5.3) 의사코드 그대로 구현.
//
// 규칙 우선순위 (v0.4 — PM 결정 사항 반영):
//   1. 동명이인(이름 같은 active 회원 ≥2명) → 항상 'multi' (자동 금지) — PM Q5
//   2. 이름+금액 정확일치 (1건) → 'auto_exact'
//   3. "이름/항목명" 패턴 (payerName 또는 memo 의 '/' 분리) → 'auto_pattern'
//      ※ pattern 매칭 시에도 금액이 항목 금액과 다르면 'amount_mismatch'.
//   4. 이름 매칭 + 미납 1건:
//        4-a. 항목 금액 == CSV 금액 → 'auto_oldest'
//        4-b. 항목 금액 != CSV 금액 → 'amount_mismatch' (부분/초과 납부, 임원 수동 처리) — PM BE-Q4
//   5. 이름 매칭 + 미납 다수:
//        5-a. 정확 금액 일치 후보 1건 → 'auto_exact'
//        5-b. 정확 금액 일치 후보 ≥2건 → 'multi'
//        5-c. 정확 금액 일치 후보 0건 → 'amount_mismatch' (부분/초과)
//   6. 그 외 → 'none'
// =====================================================================

import type {
  DuesMatchKind,
  DuesMatchType,
  DuesStatus,
} from '@/lib/types/database';

export interface CandidateMember {
  id: string;
  name: string;
  cohortYear: number | null;
}

export interface CandidatePayment {
  paymentId: string;
  memberId: string;
  memberName: string;
  cohortYear: number | null;
  termId: string;
  termLabel: string;
  termAmountKrw: number;
  termDueDate: string | null; // 'YYYY-MM-DD' — 오래된 미납 정렬 키
  currentStatus: DuesStatus;
}

export interface TransactionLike {
  rawPayerName: string;
  rawMemo: string | null;
  rawAmountKrw: number;
  rawTransactionDate: string;
}

export interface MatchedRow extends TransactionLike {
  kind: DuesMatchKind;
  matchType: DuesMatchType | null;
  candidates: CandidatePayment[];
  matchedPaymentId: string | null;
}

// 이름 정규화: trim + 모든 공백 제거 (한글/영문 공백 모두).
export function normalizeName(s: string): string {
  return (s ?? '').toString().replace(/\s+/g, '').trim();
}

// 미납 정렬 키: due_date 오름차순, null 은 가장 마지막.
function sortByOldest(a: CandidatePayment, b: CandidatePayment): number {
  const ad = a.termDueDate ?? '9999-12-31';
  const bd = b.termDueDate ?? '9999-12-31';
  return ad.localeCompare(bd);
}

// "이름/항목" 패턴에서 항목 토큰 매칭 — 항목 라벨에 토큰이 포함되면 일치로 본다.
function findTermPaymentByTokens(
  unpaidForMember: CandidatePayment[],
  termToken: string
): CandidatePayment | null {
  const token = normalizeName(termToken);
  if (!token) return null;
  // 부분 문자열(공백 제거) 일치
  const hit = unpaidForMember.find((p) =>
    normalizeName(p.termLabel).includes(token)
  );
  return hit ?? null;
}

export interface MatchInput {
  transactions: TransactionLike[];
  members: CandidateMember[];
  /** memberId → 해당 회원의 미납(unpaid/rejected) 항목 (오래된 순 정렬 권장) */
  unpaidByMember: Record<string, CandidatePayment[]>;
}

export function runMatcher(input: MatchInput): MatchedRow[] {
  const { transactions, members, unpaidByMember } = input;

  // 동명이인 집합 (정규화된 이름 기준)
  const nameCount = new Map<string, number>();
  for (const m of members) {
    const k = normalizeName(m.name);
    nameCount.set(k, (nameCount.get(k) ?? 0) + 1);
  }

  // 이름 → 멤버 인덱스
  const byName = new Map<string, CandidateMember[]>();
  for (const m of members) {
    const k = normalizeName(m.name);
    const list = byName.get(k) ?? [];
    list.push(m);
    byName.set(k, list);
  }

  return transactions.map((tx) => match(tx, byName, nameCount, unpaidByMember));
}

function candidatesForName(
  payerName: string,
  byName: Map<string, CandidateMember[]>,
  unpaidByMember: Record<string, CandidatePayment[]>
): CandidatePayment[] {
  const members = byName.get(normalizeName(payerName)) ?? [];
  const out: CandidatePayment[] = [];
  for (const m of members) {
    const u = unpaidByMember[m.id] ?? [];
    for (const p of u) out.push(p);
  }
  return out;
}

function match(
  tx: TransactionLike,
  byName: Map<string, CandidateMember[]>,
  nameCount: Map<string, number>,
  unpaidByMember: Record<string, CandidatePayment[]>
): MatchedRow {
  const payerKey = normalizeName(tx.rawPayerName);

  // 1) 동명이인 → 항상 multi
  if ((nameCount.get(payerKey) ?? 0) >= 2) {
    const cands = candidatesForName(tx.rawPayerName, byName, unpaidByMember);
    return makeRow(tx, 'multi', null, cands, null);
  }

  const hitMembers = byName.get(payerKey) ?? [];

  // 단일 회원 매칭 케이스
  if (hitMembers.length === 1) {
    const m = hitMembers[0];
    const unpaid = (unpaidByMember[m.id] ?? []).slice().sort(sortByOldest);
    if (unpaid.length === 0) {
      // 이름만 일치 + 미납 없음. memo 패턴은 일반적으로 '이름/항목'이므로
      // 미납이 없으면 매칭 불가.
      return tryPatternFallback(tx, byName, unpaidByMember);
    }

    // 2) 이름+금액 정확 일치
    const exact = unpaid.filter((p) => p.termAmountKrw === tx.rawAmountKrw);
    if (exact.length === 1) {
      return makeRow(tx, 'auto', 'auto_exact', exact, exact[0].paymentId);
    }
    if (exact.length > 1) {
      return makeRow(tx, 'multi', null, exact, null);
    }

    // 4) 미납 1건
    if (unpaid.length === 1) {
      const only = unpaid[0];
      if (only.termAmountKrw === tx.rawAmountKrw) {
        // 4-a. 금액 일치 — auto_oldest (단일이라 사실상 그게 곧 가장 오래된)
        return makeRow(tx, 'auto', 'auto_oldest', unpaid, only.paymentId);
      }
      // 4-b. 금액 불일치 — 부분/초과 납부. 자동 매칭 거부 (PM BE-Q4).
      //      후보 자체는 유지하여 임원이 수동 선택 가능하도록 한다.
      return makeRow(tx, 'amount_mismatch', 'amount_mismatch', unpaid, null);
    }

    // 5) 미납 다수, 정확 금액 일치 후보 없음 → amount_mismatch (부분/초과)
    //    UI 에서 추천=가장 오래된 으로 표시하여 임원이 수동 선택 가능.
    const withRecommendation = unpaid.map((p, idx) => ({
      ...p,
      recommended: idx === 0,
    }));
    return makeRow(
      tx,
      'amount_mismatch',
      'amount_mismatch',
      withRecommendation,
      null
    );
  }

  // 이름 매칭 0건 → "이름/항목" 패턴 시도
  return tryPatternFallback(tx, byName, unpaidByMember);
}

function tryPatternFallback(
  tx: TransactionLike,
  byName: Map<string, CandidateMember[]>,
  unpaidByMember: Record<string, CandidatePayment[]>
): MatchedRow {
  for (const src of [tx.rawPayerName, tx.rawMemo ?? '']) {
    const s = (src ?? '').toString();
    if (!s.includes('/')) continue;
    const [namePart, termPart] = s.split('/').map((p) => p.trim());
    if (!namePart || !termPart) continue;

    const candMembers = byName.get(normalizeName(namePart)) ?? [];
    if (candMembers.length !== 1) continue;
    const m = candMembers[0];
    const unpaid = (unpaidByMember[m.id] ?? []).slice().sort(sortByOldest);
    const pmt = findTermPaymentByTokens(unpaid, termPart);
    if (pmt) {
      // pattern 매칭은 항목까지 특정되므로 금액 일치 여부로 자동/수동 분기.
      if (pmt.termAmountKrw === tx.rawAmountKrw) {
        return makeRow(tx, 'auto', 'auto_pattern', [pmt], pmt.paymentId);
      }
      // 부분/초과 — 자동 금지, 후보로 표시.
      return makeRow(tx, 'amount_mismatch', 'amount_mismatch', [pmt], null);
    }
  }
  return makeRow(tx, 'none', null, [], null);
}

function makeRow(
  tx: TransactionLike,
  kind: DuesMatchKind,
  matchType: DuesMatchType | null,
  candidates: CandidatePayment[],
  matchedPaymentId: string | null
): MatchedRow {
  return {
    ...tx,
    kind,
    matchType,
    candidates,
    matchedPaymentId,
  };
}
