-- =====================================================================
-- 20260520000006_dues.sql
-- 목적: 회비 항목(dues_term) + 회원별 납부 행(dues_payment) + eager 백필 트리거
-- US-40, US-41, US-42, US-43 (P0 수기 회비 운영)
-- 회원 200명 이하 가정으로 새 dues_term 생성 시 활성 회원 전체에 unpaid 행 INSERT.
-- 부분납부 가능성 대비: status는 varchar + CHECK (ENUM 대신).
-- =====================================================================

-- 1) dues_term -----------------------------------------------------------
create table if not exists public.dues_term (
  id              uuid primary key default gen_random_uuid(),
  label           text not null check (char_length(label) between 1 and 60),  -- 예: "2026-1학기 회비"
  amount_krw      integer not null check (amount_krw >= 0),                    -- 원 단위 정수
  due_date        date,                                                         -- 납부 마감 (nullable)
  description_md  text check (description_md is null or char_length(description_md) <= 4000),
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  constraint dues_term_label_uniq unique (label)
);

create index if not exists dues_term_created_at_desc_idx on public.dues_term (created_at desc) where deleted_at is null;
create index if not exists dues_term_due_date_idx        on public.dues_term (due_date);

drop trigger if exists trg_dues_term_updated_at on public.dues_term;
create trigger trg_dues_term_updated_at
  before update on public.dues_term
  for each row execute function public.set_updated_at();

comment on table  public.dues_term is '학기 단위 회비 항목. UNIQUE(label). 활성 회원에게 자동 백필.';
comment on column public.dues_term.amount_krw is '회비 금액(원, 정수).';

-- 2) dues_payment --------------------------------------------------------
-- status: 'unpaid' | 'paid' | 'exempt' (+ 향후 'partial' 검토)
-- ENUM 대신 varchar + CHECK 제약으로 두어 새 상태 추가가 마이그레이션 비용↓.
-- member_id NOT NULL 유지 — 탈퇴 회원은 anonymous_user_id()로 옮긴다(보존 정책).
create table if not exists public.dues_payment (
  id            uuid primary key default gen_random_uuid(),
  dues_term_id  uuid not null references public.dues_term(id) on delete cascade,
  member_id     uuid not null references auth.users(id) on delete restrict,
  status        text not null default 'unpaid'
                  check (status in ('unpaid', 'paid', 'exempt', 'partial')),
  paid_amount_krw integer check (paid_amount_krw is null or paid_amount_krw >= 0),  -- partial 대비
  memo          text check (memo is null or char_length(memo) <= 500),
  paid_at       timestamptz,
  updated_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint dues_payment_term_member_uniq unique (dues_term_id, member_id)
);

create index if not exists dues_payment_term_status_idx on public.dues_payment (dues_term_id, status);
create index if not exists dues_payment_member_idx      on public.dues_payment (member_id);
create index if not exists dues_payment_updated_by_idx  on public.dues_payment (updated_by);

drop trigger if exists trg_dues_payment_updated_at on public.dues_payment;
create trigger trg_dues_payment_updated_at
  before update on public.dues_payment
  for each row execute function public.set_updated_at();

comment on table public.dues_payment is '회원별 회비 납부 상태. UNIQUE(dues_term_id, member_id). status=unpaid|paid|exempt|partial.';

-- 3) dues_term 생성 시 활성 회원 전체에 unpaid 행 백필 ------------------
-- 회원 ≤200명 가정, 행 수는 회원 수 × 학기 수 (수십 학기 누적해도 수천 행).
create or replace function public.backfill_dues_payments_for_term()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.dues_payment (dues_term_id, member_id, status)
  select new.id, p.id, 'unpaid'
  from public.profiles p
  where p.status = 'active'
    and p.is_anonymous_placeholder = false
  on conflict (dues_term_id, member_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_dues_term_backfill on public.dues_term;
create trigger trg_dues_term_backfill
  after insert on public.dues_term
  for each row execute function public.backfill_dues_payments_for_term();

comment on function public.backfill_dues_payments_for_term()
  is '새 dues_term insert 시 활성 회원 모두에게 status=unpaid 행 자동 생성.';

-- 4) 신규 가입자가 활성화될 때, 진행중인 dues_term에 unpaid 행 추가 -----
-- PM 정책: 새로 가입한 활성 회원도 현재 학기 미납자로 잡힌다(임원이 면제 처리 가능).
create or replace function public.fanout_dues_payments_for_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.status = 'active'
      and (tg_op = 'INSERT' or old.status is distinct from new.status)
      and new.is_anonymous_placeholder = false) then
    insert into public.dues_payment (dues_term_id, member_id, status)
    select t.id, new.id, 'unpaid'
    from public.dues_term t
    where t.deleted_at is null
    on conflict (dues_term_id, member_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_dues_fanout on public.profiles;
create trigger trg_profiles_dues_fanout
  after insert or update of status on public.profiles
  for each row execute function public.fanout_dues_payments_for_member();

comment on function public.fanout_dues_payments_for_member()
  is '회원이 active 전환 시 모든 활성 dues_term에 unpaid 행 자동 생성.';
