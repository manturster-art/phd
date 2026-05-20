-- =====================================================================
-- 20260520000011_reject_membership_uses_rejected.sql
-- 목적: reject_membership RPC가 status='rejected'를 사용하도록 변경 (B-01)
--       + middleware/UI가 반려 사유를 분기 표시할 수 있도록 컬럼명 보강
-- 의존: 20260520000010_profile_status_rejected_enum.sql 에서 'rejected' enum 값 추가됨
-- =====================================================================

-- 1) rejection_reason 컬럼 추가 (기존 rejected_reason 와 의미 동일하나
--    이름이 PM/Designer 가이드(`rejection_reason`)와 통일되지 않아 별칭 컬럼을 둔다.
--    기존 rejected_reason 컬럼은 보존(읽기 호환), 신규 코드는 rejection_reason 사용.
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists rejection_reason text;

-- 기존 데이터 백필 (rejected_reason -> rejection_reason)
update public.profiles
  set rejection_reason = rejected_reason
  where rejection_reason is null
    and rejected_reason is not null;

comment on column public.profiles.rejection_reason
  is '가입 반려 사유. status=rejected 인 행에서만 채워진다. 회원에게는 노출 가능(본인 안내용).';

-- 2) reject_membership RPC: status를 'rejected'로 변경
--    + 두 컬럼(rejected_reason, rejection_reason) 모두 채워서 호환성 유지.
-- ---------------------------------------------------------------------
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
  set status = 'rejected'::public.profile_status,
      rejected_reason  = p_reason,
      rejection_reason = p_reason,
      approved_by      = auth.uid()
  where id = p_user_id and status = 'pending';

  if not found then
    raise exception 'not_found_or_not_pending';
  end if;

  insert into public.notifications (recipient_id, kind, title, body)
  values (p_user_id, 'membership_rejected', '가입이 반려되었습니다.', coalesce(p_reason, ''));
end;
$$;

comment on function public.reject_membership(uuid, text)
  is '임원/관리자가 pending 회원을 rejected로 반려. v0.2: status=rejected (이전 suspended). 사유 기록 + 알림 생성.';

-- 3) approve_membership: rejection_reason도 초기화 (재가입/재승인 대비)
-- ---------------------------------------------------------------------
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
  set status = 'active'::public.profile_status,
      approved_at = now(),
      approved_by = auth.uid(),
      rejected_reason  = null,
      rejection_reason = null
  where id = p_user_id and status = 'pending';

  if not found then
    raise exception 'not_found_or_not_pending';
  end if;

  insert into public.notifications (recipient_id, kind, title, body)
  values (p_user_id, 'membership_approved', '가입이 승인되었습니다.', '원우회 앱에 오신 것을 환영합니다.');
end;
$$;
