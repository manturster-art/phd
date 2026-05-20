-- =====================================================================
-- 20260520000009_rpc_helpers.sql
-- 목적: 자주 쓰이는 도메인 RPC (Supabase 클라이언트에서 `.rpc()`로 호출)
-- - 미납자 목록 (US-43)
-- - 가입 승인/반려 (US-50) — status 변경을 트랜잭션으로 묶고 알림 생성
-- - 알림 일괄 읽음 처리
-- =====================================================================

-- 1) 회비 미납자 목록 (특정 dues_term 대상) ----------------------------
-- 임원 권한 자체 체크 (RLS와 중복이지만 RPC 단독 호출도 안전하게)
create or replace function public.list_dues_unpaid(p_dues_term_id uuid)
returns table (
  member_id    uuid,
  name         text,
  cohort_year  int,
  lab          text,
  phone        text,
  status       text,
  memo         text,
  updated_at   timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_officer() then
    raise exception 'forbidden: officer role required';
  end if;

  return query
  select
    dp.member_id,
    pr.name,
    pr.cohort_year,
    pr.lab,
    pr.phone,
    dp.status,
    dp.memo,
    dp.updated_at
  from public.dues_payment dp
  join public.profiles pr on pr.id = dp.member_id
  where dp.dues_term_id = p_dues_term_id
    and dp.status = 'unpaid'
    and pr.status = 'active'
  order by pr.cohort_year asc nulls last, pr.name asc;
end;
$$;

comment on function public.list_dues_unpaid(uuid)
  is '특정 dues_term의 미납 회원 목록(이름/기수/연구실/연락처/메모). 임원 전용.';

-- 2) 가입 승인/반려 ---------------------------------------------------
create or replace function public.approve_membership(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_officer() then
    raise exception 'forbidden: officer role required';
  end if;

  update public.profiles
  set status = 'active',
      approved_at = now(),
      approved_by = auth.uid(),
      rejected_reason = null
  where id = p_user_id and status = 'pending';

  if not found then
    raise exception 'not_found_or_not_pending';
  end if;

  insert into public.notifications (recipient_id, kind, title, body)
  values (p_user_id, 'membership_approved', '가입이 승인되었습니다.', '원우회 앱에 오신 것을 환영합니다.');
end;
$$;

create or replace function public.reject_membership(p_user_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_officer() then
    raise exception 'forbidden: officer role required';
  end if;

  update public.profiles
  set status = 'suspended',
      rejected_reason = p_reason,
      approved_by = auth.uid()
  where id = p_user_id and status = 'pending';

  if not found then
    raise exception 'not_found_or_not_pending';
  end if;

  insert into public.notifications (recipient_id, kind, title, body)
  values (p_user_id, 'membership_rejected', '가입이 반려되었습니다.', coalesce(p_reason, ''));
end;
$$;

comment on function public.approve_membership(uuid) is '임원/관리자가 pending 회원을 active로 승격. 알림 생성.';
comment on function public.reject_membership(uuid, text) is '임원/관리자가 pending 회원을 suspended로 반려. 사유 기록 + 알림 생성.';

-- 3) 알림 일괄 읽음 처리 -----------------------------------------------
create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  update public.notifications
  set read_at = now()
  where recipient_id = auth.uid() and read_at is null;
  get diagnostics n = row_count;
  return n;
end;
$$;

comment on function public.mark_all_notifications_read()
  is '본인의 미읽음 알림 모두 읽음 처리. 영향받은 행 수 반환.';

-- 4) 권한 위임 (관리자 전용) ------------------------------------------
create or replace function public.grant_officer(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden: admin role required';
  end if;
  update public.profiles set role = 'officer' where id = p_user_id and status = 'active';
end;
$$;

create or replace function public.revoke_officer(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden: admin role required';
  end if;
  update public.profiles set role = 'member' where id = p_user_id and role = 'officer';
end;
$$;

comment on function public.grant_officer(uuid)  is '관리자가 회원에게 officer 권한 부여.';
comment on function public.revoke_officer(uuid) is '관리자가 officer 권한 회수 (admin은 회수 불가).';
