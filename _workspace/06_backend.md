> ⚠️ 임시 Backend 섹션 — Phase 5에서 통합 예정

# 06. Backend 설계 — 회비 모듈 확장 (입금 신고 + CSV 매칭)

> 작성자: Backend Engineer 에이전트
> 작성일: 2026-05-20
> 입력: `_workspace/06_pm.md` v0.1, `_workspace/03_backend_design.md` v0.2, `supabase/migrations/20260520000006_dues.sql`, `supabase/migrations/20260520000013_dues_memo_public.sql`
> 산출물: 본 문서 + `supabase/migrations/20260520000015_dues_bank_integration.sql`
>           + `supabase/migrations/20260520000016_dues_match_log_amount_mismatch_label.sql` (v0.4)

## 변경 로그
| 날짜 | 버전 | 변경 |
|------|------|------|
| 2026-05-20 | v0.1 | PM 06 기반 초안. status 확장(`pending_payment`/`rejected`), reported_*/rejection_reason/match_source/bank_account_id 컬럼, dues_match_log 신규, RLS·가드 트리거. |
| 2026-05-21 | v0.4 | **QA P0-1 픽스 + PM 결정 반영**. commit API 에 status/금액 충돌 검사 추가, 매칭 알고리즘에 `amount_mismatch` 라벨 도입(부분/초과 자동 매칭 금지), match_log CHECK 제약에 `amount_mismatch` 추가. 응답 스키마에 `{confirmed, skipped[]}` 신규 필드. |

---

## 0. 핵심 결정 사항

| # | 결정 | 사유 |
|---|------|------|
| D1 | `dues_payment.status` 는 **ENUM이 아니라 text+CHECK** (v0.1 결정) | 기존 마이그레이션이 ENUM 대신 CHECK 사용. ENUM `alter type ... add value` 대신 CHECK 재정의(idempotent)로 add-only. |
| D2 | reported_amount/raw_amount 는 **bigint** | PM이 long-term 부분/초과 납부 가능성을 시사. 안전하게 bigint. 기존 `amount_krw int`/`paid_amount_krw int`는 유지(호환). |
| D3 | `bank_account_id uuid` 는 **FK 미설정 예약 컬럼** | PM Q1: `bank_account` 테이블은 본 범위 밖. 향후 FK 추가 마이그레이션으로 처리. |
| D4 | CSV 매칭 RPC 는 **만들지 않음**. Next.js Route Handler가 직접 처리 | (a) papaparse/xlsx는 Node 런타임 필요 (b) 메모리 폐기를 보장하기 좋음 (c) supabase service-role 키로 일괄 upsert. RPC는 트랜잭션 보장이 필요한 일괄 확정만 향후 검토. |
| D5 | 회원 신고는 **REST 라우트가 아니라 직접 UPDATE 가능** | RLS + 가드 트리거로 `unpaid → pending_payment` 만 허용. Frontend는 `update({...})` 한 줄. 단 reported_* 필드는 같은 update에서 전송해야 가드가 통과. |

---

## 1. 스키마 변경 요약 (ERD 텍스트)

```
dues_payment {
  ── 기존 컬럼 (변경 없음) ──
  id              uuid PK
  dues_term_id    uuid FK → dues_term
  member_id       uuid FK → auth.users
  status          text  ← CHECK 확장: + 'pending_payment','rejected'
  paid_amount_krw int
  memo            text
  memo_public     bool  (v0.2 B-03)
  paid_at         timestamptz
  updated_by      uuid FK → auth.users
  created_at/updated_at

  ── v0.3 신규 (본 마이그레이션) ──
  + reported_at        timestamptz       -- 회원 신고 시각
  + reported_amount    bigint            -- 회원 입력 금액(항목금액과 다를 수 있음)
  + reported_memo      text  (≤200)
  + rejection_reason   text  (1~200)
  + bank_account_id    uuid              -- 예약 (FK 없음)
  + match_source       text CHECK in (manual|member_report|csv_upload)
}

dues_match_log {  -- 신규 테이블
  id                    uuid PK
  payment_id            uuid FK → dues_payment ON DELETE CASCADE
  raw_payer_name        text NOT NULL (1~60)
  raw_memo              text (≤200)
  raw_amount            bigint
  raw_transaction_date  date
  source_bank           text CHECK in (kb|shinhan|woori|kakaobank|toss|unknown)
  match_type            text CHECK in (auto_exact|auto_pattern|auto_oldest|manual)
  matched_at            timestamptz DEFAULT now()
  matched_by            uuid FK → auth.users
}

dues_payment.status 상태 머신:
  unpaid ──(member_report)──▶ pending_payment ──(officer confirm)──▶ paid
    │                            │
    │                            └─(officer reject, reason)─▶ rejected
    │                            └─(member cancel US-C04)──▶ unpaid
    └──(officer toggle, 흐름A)──▶ paid / exempt
  rejected ──(앱 자동 / 회원 진입)──▶ unpaid
  paid ◀── (csv_upload 일괄 확정: status=paid, match_source='csv_upload', + match_log INSERT)
```

---

## 2. 마이그레이션 파일 위치 및 적용 순서

| 순서 | 파일 | 비고 |
|------|------|------|
| 기존 | `20260520000001` ~ `20260520000014` | 변경 없음 |
| **신규** | **`20260520000015_dues_bank_integration.sql`** | 본 작업물. add-only. |

적용 명령
```bash
supabase db push                   # 운영
supabase db reset                  # 로컬 (전체 재적용)
```

마이그레이션은 idempotent: `if not exists` / `do $$ ... $$` 블록 / `drop policy if exists` 등으로 재실행 안전.

---

## 3. RLS 정책 매트릭스 (회비 확장 부분)

| 테이블 | 액션 | 비회원 | 회원(active, 본인 행) | 회원(active, 타인 행) | 임원 | 관리자 |
|--------|------|--------|------|------|------|------|
| `dues_payment` | SELECT | × | ○ (기존) | × | ○ (기존) | ○ |
| `dues_payment` | UPDATE `status: unpaid → pending_payment` (+ reported_*) | × | **○ (신규)** | × | ○ | ○ |
| `dues_payment` | UPDATE `status: pending_payment → unpaid` (신고 취소) | × | **○ (신규)** | × | ○ | ○ |
| `dues_payment` | UPDATE `status: pending_payment → paid/rejected` | × | × (트리거 차단) | × | ○ | ○ |
| `dues_payment` | UPDATE `rejection_reason`, `match_source`, `paid_at`, `updated_by` | × | × (트리거 옛 값 복원) | × | ○ | ○ |
| `dues_payment` | UPDATE `memo`, `memo_public` | × | × (B-03 가드) | × | ○ | ○ |
| `dues_match_log` | SELECT | × | ○ (본인 payment_id 행만) | × | ○ (전체) | ○ |
| `dues_match_log` | INSERT | × | × | × | ○ (matched_by = auth.uid()) | ○ |
| `dues_match_log` | UPDATE/DELETE | × | × | × | × (정책 부재) | × |

> 가드 트리거 `guard_dues_payment_member_report` 는 `is_officer()` 통과 시 즉시 return — 임원/관리자에게는 무영향. 회원 셀프 UPDATE에 대해서만 status 전이를 화이트리스트(`unpaid↔pending_payment`)로 강제하고, 임원 전용 컬럼(`rejection_reason`/`match_source`/`paid_at`/`updated_by`/`paid_amount_krw`/`bank_account_id`)을 옛 값으로 복원한다.

---

## 4. API/RPC 엔드포인트 명세

> Frontend는 Supabase JS SDK 직접 호출이 기본. 트랜잭션이 필요한 CSV 일괄 확정만 Next.js Route Handler를 둔다. 모든 응답은 KST 표시 시 ISO8601 → 클라이언트 포매팅.

### 4.1 [흐름 C] 회원 — 입금 신고
**호출 패턴 (직접 update)**
```ts
// lib/api/dues.ts 에 추가:
export async function reportMyDuesPayment(
  supabase: TypedSupabaseClient,
  paymentId: string,
  input: { reportedAt: string; reportedAmount: number; reportedMemo?: string | null }
) {
  const { data, error } = await supabase
    .from('dues_payment')
    .update({
      status: 'pending_payment',
      reported_at: input.reportedAt,
      reported_amount: input.reportedAmount,
      reported_memo: input.reportedMemo ?? null,
    })
    .eq('id', paymentId)
    .select('id, status, reported_at, reported_amount, reported_memo')
    .single();
  if (error) throw error;
  return data;
}
```
- 가드: RLS(`dues_payment_update_self_report`) + 트리거(`guard_dues_payment_member_report`).
- 에러: 다른 회원의 payment 시도 → `error.code='PGRST116'` (행 없음). 잘못된 status 전이 시도 → 옛 값으로 복원되어 update는 성공하지만 status 변경 없음(클라이언트에서 응답 status 검증 필수).

### 4.2 [흐름 C] 회원 — 신고 취소 (US-C04, P1)
```ts
export async function cancelMyDuesReport(
  supabase: TypedSupabaseClient,
  paymentId: string
) {
  const { error } = await supabase
    .from('dues_payment')
    .update({ status: 'unpaid', reported_at: null, reported_amount: null, reported_memo: null })
    .eq('id', paymentId);
  if (error) throw error;
}
```
- 가드: `pending_payment → unpaid` 전이만 허용. 임원이 이미 컨펌(`paid`) 한 행은 옛 값 복원되어 무효.

### 4.3 [흐름 C] 임원 — 컨펌
**REST**: `POST /api/dues/admin/payments/:id/approve`
- 입력: 없음 (Authorization 쿠키만)
- 처리(Route Handler):
  1. 세션 → `is_officer()` 검증
  2. `select status, reported_at, reported_amount from dues_payment where id=:id` (status === 'pending_payment' 검증)
  3. `update dues_payment set status='paid', paid_at=reported_at, paid_amount_krw=reported_amount, match_source='member_report', updated_by=auth.uid() where id=:id`
  4. `insert into notifications (recipient_id, kind, title, body, dues_payment_id) values (member_id, 'dues_status_changed', '회비 입금이 확인되었습니다', ..., :id)`
- 응답: `{ id, status: 'paid', paid_at }`
- 멱등: 이미 paid면 200 + `already=true`.

### 4.4 [흐름 C] 임원 — 반려
**REST**: `POST /api/dues/admin/payments/:id/reject`
- 입력: `{ reason: string }` (1~200자 필수)
- 처리: status `pending_payment → rejected`, `rejection_reason` 저장, 알림 발송.
- 응답: `{ id, status: 'rejected', rejection_reason }`
- 에러: 사유 누락 → 400 `{ code: 'reason_required' }`

> **회원 측 자동 복귀**: `rejected → unpaid` 는 (PM Q3 가정) Frontend에서 회원이 본인 화면에 진입 시 위의 4.2와 동일한 update를 호출. 본 백엔드는 별도 cron/배치 없음.

### 4.5 [흐름 B] 임원 — CSV 파싱 (DB 미저장)
**REST**: `POST /api/dues/admin/transactions/parse`
- Content-Type: `multipart/form-data`, 단일 파일 `file` (≤2MB, ≤1000행)
- 처리:
  1. Node `formData()` 로 `Blob` 수신 → 메모리 `ArrayBuffer`
  2. 확장자/MIME에 따라 papaparse (CSV) 또는 xlsx (XLSX) 로 파싱
  3. 헤더 1행 비교로 은행 자동 감지 (§5 매핑표)
  4. 표준화된 거래 행 → 매칭 알고리즘 실행 (§5)
  5. 응답 후 즉시 GC (변수 참조 해제, 디스크/Storage 저장 절대 금지)
- 응답:
```ts
{
  detectedBank: 'kb' | 'shinhan' | 'woori' | 'kakaobank' | 'toss' | 'unknown',
  totalRows: 142,
  rows: Array<{
    rawPayerName: string,
    rawMemo: string | null,
    rawAmount: number,
    rawTransactionDate: string,        // 'YYYY-MM-DD'
    matchType: 'auto_exact' | 'auto_pattern' | 'auto_oldest' | 'multi' | 'none',
    candidates: Array<{                  // multi 일 때만 채워짐. 단일 매칭 시 [matched]만.
      paymentId: string,
      memberId: string,
      memberName: string,
      cohortYear: number | null,
      termLabel: string,
      termAmount: number,
      currentStatus: 'unpaid' | 'pending_payment' | 'rejected' | ...,
    }>,
    matchedPaymentId: string | null,    // auto_* 일 때 채워짐
  }>
}
```

### 4.6 [흐름 B] 임원 — 일괄 확정
**REST**: `POST /api/dues/admin/transactions/commit`
- 입력:
```ts
{
  rows: Array<{
    matchType: 'auto_exact' | 'auto_pattern' | 'auto_oldest' | 'manual',
    paymentId: string,
    sourceBank: 'kb'|'shinhan'|'woori'|'kakaobank'|'toss'|'unknown',
    raw: {
      payerName: string,
      memo: string | null,
      amount: number,
      transactionDate: string,    // 'YYYY-MM-DD'
    }
  }>
}
```
- 처리(Route Handler):
  1. `is_officer()` 검증
  2. Postgres 트랜잭션 (단일 RPC 추후 도입 권장; 현 단계에서는 supabase service-role 클라이언트로 각 row 처리 후 실패 카운트 반환):
     ```sql
     update dues_payment
        set status='paid',
            paid_at = :transaction_date::timestamptz,
            paid_amount_krw = :amount,
            memo = coalesce('[CSV] ' || nullif(:raw_memo,''), memo),
            match_source = 'csv_upload',
            updated_by = auth.uid()
      where id = :payment_id;

     insert into dues_match_log
            (payment_id, raw_payer_name, raw_memo, raw_amount, raw_transaction_date,
             source_bank, match_type, matched_by)
     values (:payment_id, :payer_name, left(:raw_memo,200), :amount, :transaction_date,
             :source_bank, :match_type, auth.uid());
     ```
  3. 각 성공 row 마다 `notifications` 행 1개 INSERT (kind='dues_status_changed').
- 응답: `{ ok: number, failed: number, failures: Array<{ paymentId, reason }> }`
- 부분 실패 정책: row별 try/catch, 전체 롤백 X (사용자 합의 후 추후 단일 RPC + savepoint 도입 검토).

---

## 5. CSV/XLSX 파싱 사양

### 5.1 라이브러리 (package.json 추가 예정)
| 패키지 | 용도 | 비고 |
|--------|------|------|
| `papaparse` | CSV 파싱 | 자동 인코딩 감지 어려움 → 5.2의 인코딩 가이드 필요 |
| `xlsx` (SheetJS Community) | XLSX 파싱 | 첫 시트만 처리. raw 셀 값 사용. |
| (선택) `iconv-lite` | EUC-KR → UTF-8 변환 | KB/우리은행 CSV가 EUC-KR로 다운로드되는 경우 대응 |

### 5.2 5개 은행 헤더 매핑표

> 실제 양식은 은행 정책 변경 가능. 매핑은 **부분 문자열 포함** 기준(공백/괄호 제거 후) 으로 매칭.

| 표준 필드 | KB국민 | 신한 | 우리 | 카카오뱅크 | 토스 |
|-----------|--------|------|------|-----------|------|
| `transactionDate` | `거래일시` | `거래일자` | `거래일시` | `거래일시` | `일시` |
| `payerName` | `적요` (입금 시 보낸이) | `보낸분/받는분` | `보낸분` | `받는분/보낸분` | `보낸분` |
| `amount` (입금만) | `입금액(원)` | `입금금액` | `입금` | `입금금액` | `입금` |
| `memo` | `메모` | `내용` | `적요` | `메모` | `메모` |
| `bankHint` (감지키) | 헤더에 `KB`/`국민`/`거래일시` + `적요` | `신한` 또는 `보낸분/받는분` | `우리` 또는 `적요`+`잔액(원)` | `카카오` 또는 `kakaobank` | `토스` 또는 `Toss` |

**감지 알고리즘**:
```ts
function detectBank(headers: string[]): SourceBank {
  const norm = headers.map(h => h.replace(/\s+|\(|\)/g, '').toLowerCase());
  if (norm.some(h => h.includes('카카오'))) return 'kakaobank';
  if (norm.some(h => h === '보낸분/받는분') || norm.includes('신한')) return 'shinhan';
  if (norm.some(h => h.includes('toss') || h.includes('토스'))) return 'toss';
  if (norm.includes('적요') && norm.some(h => h.includes('국민') || h.includes('kb'))) return 'kb';
  if (norm.includes('보낸분') && norm.includes('적요')) return 'woori';
  return 'unknown';
}
```
미감지(`unknown`) → 클라이언트에 "수동 매핑" 폼 노출 폴백(US-B01 수용 기준).

### 5.3 매칭 알고리즘 (의사코드)

```python
# 사전 준비: O(N+M)
members      = profiles.where(status in ['active','suspended','withdrawn','rejected'])
                       .select(id, name, cohort_year)
# 동명이인 집합
name_count   = Counter(m.name for m in members)
homonyms     = { name for name, c in name_count.items() if c > 1 }
# 미납 항목 인덱스
unpaid_by_member = {
  m.id: dues_payment.where(member_id=m.id, status in ['unpaid','rejected'])
                    .join(dues_term).order_by(dues_term.due_date asc, created_at asc)
  for m in members
}
# 학기 라벨 정규화 ("2026-3월회비" → 키워드 토큰)
term_tokens  = { t.id: tokenize(t.label) for t in dues_term }

# 거래 행 처리
def match(row):
  payer = normalize(row.payerName)   # trim, 공백 제거
  # 1) 동명이인은 자동매칭 금지
  if payer in homonyms:
    return ('multi', candidates_by_name(payer))

  hit_members = [m for m in members if normalize(m.name) == payer]
  if not hit_members:
    # 2-a) "이름/항목" 패턴 시도: payer 또는 memo 에서 '/' 분리
    for src in (payer, normalize(row.memo or '')):
      parts = src.split('/')
      if len(parts) >= 2:
        cand_name = parts[0]
        cand_members = [m for m in members if normalize(m.name) == cand_name]
        if len(cand_members) == 1:
          # 항목 토큰 매칭
          term_match = find_term_by_tokens(parts[1], term_tokens)
          if term_match:
            pmt = unpaid_by_member[cand_members[0].id]
                   .first(lambda p: p.dues_term_id == term_match)
            if pmt:
              return ('auto_pattern', [pmt])
    return ('none', [])

  m = hit_members[0]
  unpaid = unpaid_by_member[m.id]

  if not unpaid:
    return ('none', [])

  # 3) 이름+금액 정확 일치
  exact = [p for p in unpaid if p.dues_term.amount_krw == row.amount]
  if len(exact) == 1:
    return ('auto_exact', [exact[0]])
  if len(exact) > 1:
    return ('multi', exact)

  # 4) 금액이 안 맞으면 가장 오래된 미납 추천 + multi 분류
  if len(unpaid) == 1:
    return ('auto_oldest', [unpaid[0]])
  return ('multi', unpaid)
```

규칙 요약 (PM 3가지에 매핑):
1. **이름+금액 정확 일치** → `auto_exact` (PM 규칙 1)
2. **"이름/항목" 패턴 메모** → `auto_pattern` (PM 규칙 2)
3. **이름 매칭 + 가장 오래된 미납** → `auto_oldest` (PM 규칙 3)
- 동명이인 → 항상 `multi` (PM Q5 합의)
- 후보 0 → `none`

성능: 회원 200명 × 학기 20개 = 4,000 unpaid 행 가정. 매칭은 거래당 O(1)~O(unpaid_by_member) → 1000행 ≤ 3초 (PM 비기능 요건).

---

## 6. 데이터 폐기 정책

| 데이터 | 위치 | 보존 | 폐기 시점 |
|--------|------|------|-----------|
| CSV/XLSX 원본 파일 | 서버 메모리 (`Blob`/`ArrayBuffer`) | **0** | Route Handler 응답 직후 변수 참조 해제, GC. **디스크/Storage 저장 절대 금지.** |
| 파싱 중간 객체 (`rows`) | 서버 메모리 | 요청 lifecycle | 응답 후 GC |
| 매칭 결과 JSON | 클라이언트 메모리 (검토 화면) | 세션 동안 | 페이지 이탈 시 React state 소멸 |
| `dues_match_log` | Postgres | **권장 2년** | 별도 보존 정책 cron(P2). 본 마이그레이션에는 cron 미포함. |
| `dues_payment.reported_memo` | Postgres | 무기한 (회비 기록의 일부) | 회원 anonymization 시 NULL 처리(기존 정책) |
| `notifications` (dues_status_changed) | Postgres | 기존 정책 (PM v0.2 §6) | 변경 없음 |

> **금지 항목 (`dues_match_log` 에 절대 저장 안 함)**: 계좌번호, 거래고유번호, 잔액, 출금 거래, 휴대폰 번호.

---

## 7. Frontend 인계 노트

### 7.1 타입 추가 (`lib/types/database.ts`)
```ts
export type DuesStatus =
  | 'unpaid' | 'paid' | 'exempt' | 'partial'
  | 'pending_payment' | 'rejected';   // 신규

// dues_payment Row/Insert/Update 에 컬럼 추가:
reported_at:      string | null;
reported_amount:  number | null;
reported_memo:    string | null;
rejection_reason: string | null;
bank_account_id:  string | null;
match_source:     'manual' | 'member_report' | 'csv_upload' | null;

// 신규 테이블 dues_match_log:
{
  id: string;
  payment_id: string;
  raw_payer_name: string;
  raw_memo: string | null;
  raw_amount: number | null;
  raw_transaction_date: string | null;
  source_bank: 'kb'|'shinhan'|'woori'|'kakaobank'|'toss'|'unknown';
  match_type: 'auto_exact'|'auto_pattern'|'auto_oldest'|'manual';
  matched_at: string;
  matched_by: string | null;
}
```

### 7.2 호출 함수 (`lib/api/dues.ts`)
| 함수 | 호출 방식 | 비고 |
|------|----------|------|
| `reportMyDuesPayment(supabase, paymentId, { reportedAt, reportedAmount, reportedMemo })` | `from('dues_payment').update(...)` | RLS+트리거가 가드. 응답 status 검증 필수. |
| `cancelMyDuesReport(supabase, paymentId)` | `from('dues_payment').update({status:'unpaid'})` | 임원 컨펌 완료 후 호출 시 무효. |
| `approveDuesPayment(officerSupabase, paymentId)` | `fetch('/api/dues/admin/payments/:id/approve', { method:'POST' })` | Route Handler |
| `rejectDuesPayment(officerSupabase, paymentId, reason)` | `fetch('/api/dues/admin/payments/:id/reject', { method:'POST', body })` | reason 필수 |
| `parseDuesCsv(file)` | `fetch('/api/dues/admin/transactions/parse', { method:'POST', body: formData })` | multipart, 응답이 매칭 결과 JSON |
| `commitDuesCsvBatch(rows)` | `fetch('/api/dues/admin/transactions/commit', { method:'POST', body: JSON })` | "자동매칭" 분류된 row만 전송 (개인정보 최소화, US-B04) |
| `listDuesMatchLog(supabase, { paymentId? })` | `from('dues_match_log').select(...).order('matched_at',{ascending:false})` | 회원은 RLS로 자기 payment 한정. 임원은 전체. |

### 7.3 컴포넌트 영향
- `components/dues/DuesHistoryCard`: status='pending_payment' → 회색+"검토중" 배지, status='rejected' → 빨강+사유 표시, status='paid' + match_source='csv_upload' → "[CSV]" 작은 라벨.
- `components/dues/DuesReportSheet` (신규): 시트 폼. 제출 시 4.1 호출.
- `components/dues/DuesPendingList` (신규): 임원용. `from('dues_payment').select('*, member:profiles!member_id(...)').eq('status','pending_payment').order('reported_at',{ascending:true})`.
- `components/dues/DuesCsvUploader` + `DuesMatchReviewTable` (신규): 4.5, 4.6 결과 렌더.
- `lib/parsers/bankCsv/{kb,shinhan,woori,kakaobank,toss}.ts`: 헤더 매핑 + 행 → 표준 객체.
- `lib/matchers/duesMatcher.ts`: §5.3 의사코드 구현.

### 7.4 알림 종류
기존 `notification_kind` ENUM 그대로 사용 (`dues_status_changed`). 본 마이그레이션에 ENUM 변경 없음. 알림 제목/본문 텍스트로 컨펌/반려/CSV 매칭 구분.

---

## 8. 테스트 시나리오 권장 (QA용)

### 8.1 RLS 우회 시도
- [ ] 회원 A가 회원 B의 payment_id 에 `update({status:'pending_payment'})` → RLS로 0 rows.
- [ ] 회원 A가 자기 payment 에 `update({status:'paid'})` → 트리거가 옛 status로 복원, update 응답에는 0 변경 또는 status가 그대로.
- [ ] 회원 A가 `update({status:'pending_payment', rejection_reason:'foo', match_source:'csv_upload'})` → rejection_reason/match_source는 옛 값으로 복원.
- [ ] 회원이 `dues_match_log` 에 INSERT 시도 → policy 부재로 차단.
- [ ] 회원이 본인 payment_id 의 match_log 만 SELECT 됨 확인 (다른 회원의 로그는 0 rows).
- [ ] 임원이 `pending_payment → paid` 호출 시 `match_source='member_report'`, `paid_at = reported_at` 설정 확인.

### 8.2 매칭 엣지 케이스
- [ ] 동명이인 (홍길동 2명, 한 명 active / 한 명 withdrawn) → 항상 `multi` 분류.
- [ ] 입금자명에 공백/괄호 (`홍 길동 (석사)`) → trim + 공백 제거 후 매칭.
- [ ] 부분 금액(항목 30,000원 / 입금 25,000원) → `auto_oldest` 가 아닌 후보로 처리, 임원 수동.
- [ ] 초과 금액(50,000원) → 동일하게 후보 분류, 임원이 수동으로 두 항목 분할 권장.
- [ ] 메모 `홍길동/2026-3월회비` → `auto_pattern` 으로 매칭.
- [ ] 미감지 헤더 → `unknown`, 클라이언트 폴백 폼.
- [ ] CSV 1000행 처리 시간 ≤ 3초 (i5, Chrome).

### 8.3 상태 전이
- [ ] `unpaid → pending_payment → paid` (정상 컨펌)
- [ ] `unpaid → pending_payment → rejected → unpaid` (반려 후 회원 진입)
- [ ] `pending_payment → unpaid` (US-C04 신고 취소) 후 다시 `pending_payment` 재신고
- [ ] 임원이 컨펌한 직후 회원이 취소 시도 → status='paid' 이므로 가드가 차단 (옛 값 유지).
- [ ] CSV 일괄 확정으로 `pending_payment → paid` 가능 여부 (현재는 unpaid 만 가정. paid 갱신은 멱등). 명세상 CSV는 unpaid/rejected/pending_payment 모두 paid로 갱신 가능 — match_source 로 출처 구분.

### 8.4 보안/감사
- [ ] CSV 업로드 후 서버 디스크/Storage 에 파일 없음 (네트워크 탭 / 파일시스템 점검).
- [ ] `dues_match_log` 행에 계좌번호/잔액 컬럼 없음 (스키마 점검).
- [ ] `dues_match_log` 에서 UPDATE/DELETE 시도 → policy 부재로 차단.

---

## 9. 미해결 사항 (PM/Designer 합의 필요)

| # | 항목 | 현 가정 |
|---|------|---------|
| BE-Q1 | CSV commit 트랜잭션 단위: row별 or 전체 | 현재 row별 (부분 성공 허용). 전체 롤백을 원하면 단일 RPC `apply_dues_csv_batch(jsonb)` 추가 마이그레이션 필요. |
| BE-Q2 | `dues_match_log` 보존 cron | 권장 2년. cron 미구현. P2에서 `pg_cron` 또는 외부 스케줄러로 추가. |
| BE-Q3 | `bank_account_id` FK 도입 시점 | 본 범위 밖. 신규 `bank_account` 테이블 + FK 추가 마이그레이션 별도. |
| BE-Q4 | 회원의 `partial` 신고 (5만 → 3만 입금) | **PM 결정 (v0.4): 부분/초과 납부는 자동 매칭 거부 = 임원 수동 처리.** 매칭 알고리즘이 `amount_mismatch` 라벨로 분류하여 임원이 후보 시트에서 수동 선택해야 한다. §10 참조. |
| BE-Q5 | 신고 cooldown | 없음. 회원이 `pending_payment → unpaid → pending_payment` 무한 반복 가능. 악용 사례 발견 시 rate limit 추가. |

---

## 10. v0.4 — 충돌 처리 정책 & 부분납부 정책 (QA P0-1 픽스)

### 10.1 매칭 라벨 enum (v0.4)

```
DuesMatchKind  (parse 단계 결과, UI 그룹화 기준)
  ├─ auto             — 자동 확정 가능 (matchType: auto_exact | auto_pattern | auto_oldest)
  ├─ multi            — 후보 ≥2 (동명이인 또는 정확금액 일치 후보 다수)
  ├─ none             — 매칭 가능한 회원/항목 없음
  └─ amount_mismatch  — (v0.4 신규) 이름 매칭은 됐으나 회비 항목 금액과 CSV 금액이 다름. 자동 금지.

DuesMatchType  (행 단위 세부 분류)
  auto_exact | auto_pattern | auto_oldest | manual | amount_mismatch | conflict
                                                       └ parse        └ commit 응답 전용
```

- `amount_mismatch` 는 parse 단계에서 결정되며 `dues_match_log.match_type` 에도 기록 가능 (CHECK 허용).
- `conflict` 는 **DB 에 절대 기록되지 않음** — commit 응답 `skipped[].reason` 에서만 사용. (DuesMatchTypeLog 타입으로 DB 컬럼은 분리.)

### 10.2 부분납부 정책 (BE-Q4 PM 결정)

- 매칭 알고리즘 (`lib/dues/matcher.ts`):
  - 이름 매칭 + 미납 1건:
    - 항목 금액 == CSV 금액 → `auto_oldest`
    - **항목 금액 != CSV 금액 → `amount_mismatch`** (kind=`amount_mismatch`, matchType=`amount_mismatch`, matchedPaymentId=null, candidates=원본 1건)
  - 이름 매칭 + 미납 다수, 정확 금액 일치 후보 0건:
    - **모두 부분/초과 → `amount_mismatch`** (candidates=미납 전체, recommended=가장 오래된)
  - "이름/항목" 패턴 매칭에서도 동일하게 금액 일치 시 `auto_pattern`, 불일치 시 `amount_mismatch`.
- UI: `TransactionReviewTable` 의 '⚠ 후보' 탭에 `multi + amount_mismatch` 가 함께 노출되며,
  amount_mismatch 행에는 `"⚠ 항목 금액과 입금액이 달라요. 부분/초과 납부인지 확인 후 수동 선택해주세요."` 경고가 표시된다.
- 임원이 수동으로 후보를 선택하면 `matchType: 'manual'` 로 일괄 확정에 포함된다 (매칭 알고리즘과 별개로 임원의 의지로 확정).
- 부분납부 시 `status='partial'` + `paid_amount_krw < amount_krw` 처리는 본 범위 밖 — 임원이 컨펌 화면에서 수동 결정한다.

### 10.3 충돌 처리 정책 (P0-1 픽스, CSV commit)

`POST /api/dues/admin/transactions/commit` 처리 흐름 (각 row 단위):

| # | 검사 | Skip 사유 (`reason`) | 비고 |
|---|------|---------------------|------|
| 0 | `matchType === 'amount_mismatch'` | `amount_mismatch` | 클라이언트가 부분/초과 행을 commit 에 포함한 경우 사전 차단 |
| 1 | payment row SELECT 실패 / 없음 | `not_found` | UUID 변조/삭제 등 |
| 2 | `status === 'paid'` | `already_paid` | **멱등성**: 같은 commit 요청을 두 번 보내도 첫 번째 이후는 모두 `already_paid` skip |
| 3 | `status ∉ {unpaid, pending_payment}` | `invalid_status` | exempt/partial/rejected 상태 — 임원 컨펌 화면에서 별도 처리 |
| 4 | `status === 'pending_payment'` 이고 `reported_amount !== CSV.amount` | `pending_mismatch` | 회원 신고를 추인하지 않음. 임원이 컨펌 화면에서 수동 처리 |
| 5 | UPDATE 시 optimistic concurrency 실패 (status 동시 변경) | `invalid_status` | `WHERE status = $cur.status` 매칭 0건 |
| 6 | UPDATE 또는 match_log INSERT 실패 | `update_failed` | DB 에러 메시지를 `detail` 에 포함 |

추인 정상 경로:

- `unpaid + 어떤 금액` → 매칭 알고리즘에서 `auto_exact` / `auto_pattern` / `auto_oldest` 로 분류된 경우만 commit 에 도달 (매칭 단계에서 금액 검증 완료) → paid 전이.
- `pending_payment + reported_amount === CSV.amount` → 회원 신고 추인 → paid 전이.

### 10.4 응답 스키마 (v0.4)

```ts
type CommitResponse = {
  confirmed: number;                  // paid 로 전이된 row 수
  skipped: Array<{
    paymentId: string;
    reason:
      | 'already_paid'
      | 'pending_mismatch'
      | 'invalid_status'
      | 'amount_mismatch'
      | 'not_found'
      | 'update_failed';
    detail?: string;                  // 사용자 표시용 한국어 메시지
  }>;
  // 하위 호환 (v0.3 클라이언트):
  ok: number;                         // === confirmed
  failed: number;                     // === skipped.length
  failures: Array<{ paymentId: string; reason: string }>;
};
```

**Frontend 인계 노트**:
- 응답의 `skipped[]` 를 받아 "충돌-검토필요" UI 슬롯에 노출.
- `reason` 별로 한국어 라벨 매핑:
  - `already_paid`     → "이미 납부 처리됨"
  - `pending_mismatch` → "회원 신고 금액과 다름 — 컨펌 화면에서 확인"
  - `invalid_status`   → "현재 상태에서 자동 확정 불가"
  - `amount_mismatch`  → "항목 금액과 입금액 불일치 — 수동 선택 필요"
  - `not_found`        → "회비 항목을 찾을 수 없음"
  - `update_failed`    → "DB 갱신 실패 (재시도 가능)"
- `TransactionsUploadFlow` 는 skipped.length > 0 시 토스트를 `"N건 확정 · M건 충돌(검토 필요)"` 로 표시 (v0.4 적용 완료).

### 10.5 마이그레이션

- `20260520000016_dues_match_log_amount_mismatch_label.sql` — add-only.
  - `dues_match_log.match_type` CHECK 제약을 재정의하여 `amount_mismatch` 추가.
  - `conflict` 는 commit 응답 전용이므로 DB 에 추가하지 않음.
  - 기존 마이그레이션 `20260520000015_dues_bank_integration.sql` 은 **수정하지 않음** (add-only 원칙).
