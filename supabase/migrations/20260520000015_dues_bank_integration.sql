-- =====================================================================
-- 20260520000015_dues_bank_integration.sql
-- 목적: 회비 모듈 확장 — 입금 신고(흐름 C) + CSV 매칭(흐름 B)
-- 입력: _workspace/06_pm.md (PM v0.1, 2026-05-20)
-- 원칙: add-only. 기존 status 값(unpaid/paid/exempt/partial) 및 컬럼은 무손상 유지.
--
-- 변경 요약:
--   1) dues_payment.status CHECK 제약을 확장하여 'pending_payment','rejected' 추가
--      (기존이 ENUM이 아니라 text+CHECK 이므로 ALTER CHECK 로 처리)
--   2) dues_payment 에 신고/반려/매칭 출처 컬럼 6종 추가
--   3) dues_match_log 신규 테이블 + 인덱스 + 트리거 + RLS
--   4) RLS: 회원이 unpaid → pending_payment 전이만 허용하도록 정책 + 가드 트리거 추가
--           임원은 기존 dues_payment_update_officer 정책으로 모든 전이 가능
--   5) match_log 임원 SELECT/INSERT, 회원은 본인 payment_id 행만 SELECT
-- =====================================================================

-- =====================================================================
-- 1) dues_payment.status CHECK 제약 확장 (pending_payment, rejected 추가)
-- =====================================================================
do $$
declare
  v_conname text;
begin
  -- 기존 CHECK 제약 이름을 찾아 제거 (이름 변동 가능성 대비).
  select conname into v_conname
    from pg_constraint
   where conrelid = 'public.dues_payment'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) ilike '%status%in%unpaid%paid%exempt%partial%';

  if v_conname is not null then
    execute format('alter table public.dues_payment drop constraint %I', v_conname);
  end if;
end $$;

alter table public.dues_payment
  add constraint dues_payment_status_check
  check (status in (
    'unpaid', 'paid', 'exempt', 'partial',
    'pending_payment', 'rejected'   -- v0.3: 입금 신고 + 임원 컨펌 흐름
  ));

comment on constraint dues_payment_status_check on public.dues_payment is
  'v0.3: pending_payment(회원 신고), rejected(임원 반려) 추가. 기존 4종 유지.';

-- =====================================================================
-- 2) dues_payment 신규 컬럼 (add-only)
-- =====================================================================
alter table public.dues_payment
  add column if not exists reported_at        timestamptz,
  add column if not exists reported_amount    bigint     check (reported_amount is null or reported_amount >= 0),
  add column if not exists reported_memo      text       check (reported_memo is null or char_length(reported_memo) <= 200),
  add column if not exists rejection_reason   text       check (rejection_reason is null or char_length(rejection_reason) between 1 and 200),
  add column if not exists bank_account_id    uuid,      -- 예약 컬럼 (NULL 허용, FK 없음, P2 도입 대비)
  add column if not exists match_source       text
    check (match_source is null or match_source in ('manual', 'member_report', 'csv_upload'));

comment on column public.dues_payment.reported_at      is '회원이 입금 신고를 제출한 시각 (KST UTC 변환).';
comment on column public.dues_payment.reported_amount  is '회원이 입력한 입금 금액(원). 항목 amount_krw 와 다를 수 있음(부분/초과).';
comment on column public.dues_payment.reported_memo    is '회원 신고 메모(최대 200자).';
comment on column public.dues_payment.rejection_reason is '임원이 입력한 반려 사유(1~200자, status=rejected 일 때).';
comment on column public.dues_payment.bank_account_id  is '예약 컬럼(P2 bank_account 테이블 도입 대비). 현재 사용 안 함.';
comment on column public.dues_payment.match_source     is 'paid 전이 출처: manual(임원 토글) / member_report(흐름 C) / csv_upload(흐름 B).';

-- 신고 목록 조회 성능 (pending_payment 행만)
create index if not exists dues_payment_pending_reported_idx
  on public.dues_payment (reported_at asc)
  where status = 'pending_payment';

-- =====================================================================
-- 3) dues_match_log — CSV 일괄 확정 감사 로그
-- =====================================================================
create table if not exists public.dues_match_log (
  id                    uuid primary key default gen_random_uuid(),
  payment_id            uuid not null references public.dues_payment(id) on delete cascade,
  raw_payer_name        text not null check (char_length(raw_payer_name) between 1 and 60),
  raw_memo              text         check (raw_memo is null or char_length(raw_memo) <= 200),
  raw_amount            bigint       check (raw_amount is null or raw_amount >= 0),
  raw_transaction_date  date,
  source_bank           text not null
    check (source_bank in ('kb','shinhan','woori','kakaobank','toss','unknown')),
  match_type            text not null
    check (match_type in ('auto_exact','auto_pattern','auto_oldest','manual')),
  matched_at            timestamptz not null default now(),
  matched_by            uuid         references auth.users(id) on delete set null
);

create index if not exists dues_match_log_payment_idx     on public.dues_match_log (payment_id);
create index if not exists dues_match_log_matched_at_desc on public.dues_match_log (matched_at desc);
create index if not exists dues_match_log_matched_by_idx  on public.dues_match_log (matched_by);

comment on table public.dues_match_log is
  'CSV 일괄 확정 감사 로그. 계좌번호/잔액/거래고유번호는 절대 보관하지 않음. raw_memo 200자 truncate. 권장 보존 2년.';
comment on column public.dues_match_log.source_bank is 'CSV 헤더 자동 감지 결과: kb/shinhan/woori/kakaobank/toss/unknown.';
comment on column public.dues_match_log.match_type is 'auto_exact(이름+금액 일치) / auto_pattern(이름/항목 메모) / auto_oldest(가장 오래된 미납 후보) / manual(임원 수동 선택).';

-- =====================================================================
-- 4) RLS 활성화 + 정책
-- =====================================================================
alter table public.dues_match_log enable row level security;

-- 안전: 같은 이름 정책이 있다면 재생성 (재실행 가능)
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'dues_match_log'
  loop
    execute format('drop policy if exists %I on public.dues_match_log', r.policyname);
  end loop;

  -- dues_payment 의 신규 정책 (회원 신고 흐름)도 idempotent 하게 재생성
  for r in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'dues_payment'
       and policyname in ('dues_payment_update_self_report')
  loop
    execute format('drop policy if exists %I on public.dues_payment', r.policyname);
  end loop;
end $$;

-- 4-1) dues_match_log: 임원 SELECT/INSERT, 회원은 본인 payment 행만 SELECT
create policy "dues_match_log_select_officer"
  on public.dues_match_log for select to authenticated
  using (public.is_officer());

create policy "dues_match_log_select_self_via_payment"
  on public.dues_match_log for select to authenticated
  using (
    public.is_active_member()
    and exists (
      select 1 from public.dues_payment dp
       where dp.id = dues_match_log.payment_id
         and dp.member_id = auth.uid()
    )
  );

create policy "dues_match_log_insert_officer"
  on public.dues_match_log for insert to authenticated
  with check (public.is_officer() and matched_by = auth.uid());

-- UPDATE/DELETE 정책 없음 = 차단. 감사 로그는 추가만, 수정/삭제 금지.

-- 4-2) dues_payment: 회원이 본인 행에 한해 신고용 UPDATE 허용
--      (기존 dues_payment_update_officer 정책은 그대로 두고 회원용을 추가)
--      가드 트리거가 status 전이를 unpaid → pending_payment 로만 제한.
create policy "dues_payment_update_self_report"
  on public.dues_payment for update to authenticated
  using (member_id = auth.uid() and public.is_active_member())
  with check (member_id = auth.uid() and public.is_active_member());

-- =====================================================================
-- 5) 가드 트리거 — 회원 신고 흐름의 status 전이 제한
--    - 임원(is_officer)은 모든 전이 허용 (기존 정책 + 본 트리거 통과)
--    - 회원(member_id = auth.uid())은 다음 전이만 허용:
--        unpaid → pending_payment         (입금 신고)
--        pending_payment → unpaid         (신고 취소, US-C04)
--      그 외 status 변경 시도 → 옛 값으로 복원 (방어 깊이; 정책 변경에 견고)
--    - 회원은 reported_*/rejection_reason/match_source/memo/memo_public 등은 수정 불가.
--      reported_* 는 unpaid→pending_payment 전이 시점에만 NEW 값 허용.
-- =====================================================================
create or replace function public.guard_dues_payment_member_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_officer boolean := public.is_officer();
  v_is_self    boolean := (new.member_id = auth.uid());
begin
  if auth.uid() is null then
    return new;
  end if;

  -- 임원/관리자는 모든 전이 허용 (memo 가드 트리거는 별도로 동작)
  if v_is_officer then
    return new;
  end if;

  -- 비-임원이 자기 행이 아닌 행을 건드릴 일은 RLS가 차단하지만, 방어 깊이로 한 번 더.
  if not v_is_self then
    -- 모든 변경을 옛 값으로 강제 복원 (실패 대신 무력화)
    new := old;
    return new;
  end if;

  -- 자기 행이라도 status 전이 제한
  if new.status is distinct from old.status then
    if not (
      (old.status = 'unpaid'          and new.status = 'pending_payment')
      or (old.status = 'pending_payment' and new.status = 'unpaid')
    ) then
      -- 허용되지 않은 전이 → 옛 값 복원
      new.status := old.status;
    end if;
  end if;

  -- 회원은 reported_* 를 unpaid→pending_payment 전이 시에만 세팅 가능
  if not (old.status = 'unpaid' and new.status = 'pending_payment') then
    -- 그 외 케이스에서 reported_* 가 바뀌면 옛 값 유지
    if new.reported_at is distinct from old.reported_at then
      new.reported_at := old.reported_at;
    end if;
    if new.reported_amount is distinct from old.reported_amount then
      new.reported_amount := old.reported_amount;
    end if;
    if new.reported_memo is distinct from old.reported_memo then
      new.reported_memo := old.reported_memo;
    end if;
  end if;

  -- 회원은 다음 컬럼들을 절대 직접 수정 불가
  new.rejection_reason := old.rejection_reason;
  new.match_source     := old.match_source;
  new.bank_account_id  := old.bank_account_id;
  new.paid_amount_krw  := old.paid_amount_krw;
  new.paid_at          := old.paid_at;
  new.updated_by       := old.updated_by;
  -- memo/memo_public 은 기존 guard_dues_payment_memo 트리거가 처리

  return new;
end;
$$;

drop trigger if exists trg_dues_payment_member_report_guard on public.dues_payment;
-- guard_dues_payment_memo (B-03)보다 먼저 돌도록 이름을 사전식으로 앞에 둠.
-- Postgres는 같은 이벤트에서 트리거 이름 알파벳 오름차순으로 실행.
create trigger trg_dues_payment_member_report_guard
  before update on public.dues_payment
  for each row execute function public.guard_dues_payment_member_report();

comment on function public.guard_dues_payment_member_report() is
  '회원 셀프 UPDATE 시 status 전이를 unpaid↔pending_payment 로 제한하고 임원 전용 컬럼을 옛 값으로 복원. 임원/관리자는 통과.';

-- =====================================================================
-- 6) Done.
--    Frontend 인계: lib/api/dues.ts 에 reportMyDuesPayment / cancelMyDuesReport /
--    approveDuesPayment / rejectDuesPayment / commitDuesCsvBatch 추가 권장.
--    타입: lib/types/database.ts 의 DuesStatus 에 'pending_payment','rejected' 추가.
-- =====================================================================
