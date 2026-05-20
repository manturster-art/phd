-- =====================================================================
-- 20260520000013_dues_memo_public.sql
-- 목적: dues_payment.memo 의 회원 노출 정책 분리 (B-03)
-- 이슈: 현재 memo가 모든 회원에게 노출됨 → 임원 내부 메모가 회원에게 새는 위험.
-- 해결:
--   1) memo_public boolean default false 컬럼 추가
--   2) SECURITY DEFINER view `dues_payment_member_view` 신설 — 회원이 본인 행을
--      이 뷰로 조회하면 memo_public=true 일 때만 memo가 노출되고, false면 NULL.
--   3) 임원용 RLS는 그대로 → 매트릭스 UI에서는 모든 memo 그대로 보임.
--   4) (선택) BEFORE UPDATE 가드: 임원만 memo / memo_public 변경 가능 (RLS와 중복이지만 명시).
-- =====================================================================

-- 1) 컬럼 추가
alter table public.dues_payment
  add column if not exists memo_public boolean not null default false;

comment on column public.dues_payment.memo_public is
  '회원 화면에 memo 를 공개할지 여부. true 면 본인 회원도 memo 조회 가능. 기본 false(임원 내부 메모).';

-- 2) 회원용 뷰 (SECURITY INVOKER가 기본; RLS는 dues_payment 정책에 의존)
--    뷰는 컬럼 단위로 memo를 마스킹하기 위함.
-- ---------------------------------------------------------------------
create or replace view public.dues_payment_member_view
with (security_invoker = true)
as
select
  dp.id,
  dp.dues_term_id,
  dp.member_id,
  dp.status,
  dp.paid_amount_krw,
  dp.paid_at,
  dp.updated_at,
  dp.created_at,
  dp.memo_public,
  -- 본인이거나 임원이면 memo 그대로, 아니면 memo_public=true인 경우만 노출
  case
    when public.is_officer() then dp.memo
    when dp.member_id = auth.uid() and dp.memo_public is true then dp.memo
    else null
  end as memo
from public.dues_payment dp;

comment on view public.dues_payment_member_view is
  '회원이 본인 회비 납부 내역을 조회할 때 사용. memo_public=false 인 메모는 NULL로 마스킹.';

-- 뷰 권한: authenticated 역할이 select 할 수 있게 grant
grant select on public.dues_payment_member_view to authenticated;

-- 3) memo / memo_public 변경 가드 트리거 (RLS와 중복이지만 방어 깊이)
--    dues_payment_update_officer 정책이 이미 임원만 update 허용하지만,
--    혹시 RLS 정책이 바뀔 때를 대비해 트리거로도 명시.
-- ---------------------------------------------------------------------
create or replace function public.guard_dues_payment_memo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if (new.memo is distinct from old.memo or new.memo_public is distinct from old.memo_public)
     and not public.is_officer() then
    new.memo        := old.memo;
    new.memo_public := old.memo_public;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_dues_payment_memo_guard on public.dues_payment;
create trigger trg_dues_payment_memo_guard
  before update on public.dues_payment
  for each row execute function public.guard_dues_payment_memo();

comment on function public.guard_dues_payment_memo()
  is 'dues_payment BEFORE UPDATE 가드: memo/memo_public 변경은 임원만.';
