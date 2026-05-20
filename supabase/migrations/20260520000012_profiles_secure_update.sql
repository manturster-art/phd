-- =====================================================================
-- 20260520000012_profiles_secure_update.sql
-- 목적: profiles.role / profiles.status 의 직접 update 권한 상승 차단 (B-05)
-- 이슈: RLS `profiles_update_self`는 행 단위만 강제하므로 일반 회원이
--       `update profiles set role='admin' where id=auth.uid()` 호출 시 통과됨.
-- 해결: BEFORE UPDATE 트리거에서 본인이 임원/관리자가 아니라면
--       보안 필드(role, status, approved_*, rejected_*, rejection_reason,
--       is_anonymous_placeholder, deleted_at) 변경을 강제로 되돌린다.
--       임원/관리자도 직접 role 변경은 막고 RPC(grant_officer/revoke_officer)로만.
-- =====================================================================

create or replace function public.guard_profiles_secure_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_officer boolean := public.is_officer();
  v_is_admin   boolean := public.is_admin();
  v_is_self    boolean := (new.id = auth.uid());
begin
  -- service_role 또는 SECURITY DEFINER RPC를 통한 호출은 auth.uid()가 null일 수 있으므로
  -- 그 경우엔 트리거에서 막지 않는다 (RPC가 자체적으로 권한 검증).
  if auth.uid() is null then
    return new;
  end if;

  -- (1) role 변경: admin만 허용. 그것도 직접 update는 사실상 막고 grant_officer/revoke_officer RPC를 권장.
  --     다만 RPC가 SECURITY DEFINER로 실행될 때 auth.uid()는 호출자이므로
  --     admin이면 RPC 경유든 직접이든 허용한다.
  if new.role is distinct from old.role then
    if not v_is_admin then
      new.role := old.role;
    end if;
  end if;

  -- (2) status 변경: officer 이상만 허용 (가입 승인/반려/정지 운영).
  --     본인이라도 일반 회원은 status를 직접 못 바꾼다. 탈퇴는 별도 RPC로 제공해야 함(추후).
  if new.status is distinct from old.status then
    if not v_is_officer then
      new.status := old.status;
    end if;
  end if;

  -- (3) approved_at / approved_by: officer 이상만.
  if new.approved_at is distinct from old.approved_at then
    if not v_is_officer then new.approved_at := old.approved_at; end if;
  end if;
  if new.approved_by is distinct from old.approved_by then
    if not v_is_officer then new.approved_by := old.approved_by; end if;
  end if;

  -- (4) rejected_reason / rejection_reason: officer 이상만.
  if new.rejected_reason is distinct from old.rejected_reason then
    if not v_is_officer then new.rejected_reason := old.rejected_reason; end if;
  end if;
  if new.rejection_reason is distinct from old.rejection_reason then
    if not v_is_officer then new.rejection_reason := old.rejection_reason; end if;
  end if;

  -- (5) is_anonymous_placeholder: 관리자만 (탈퇴 익명화 운영 시).
  if new.is_anonymous_placeholder is distinct from old.is_anonymous_placeholder then
    if not v_is_admin then
      new.is_anonymous_placeholder := old.is_anonymous_placeholder;
    end if;
  end if;

  -- (6) deleted_at: 본인 탈퇴(soft delete) 또는 임원 운영만. 일반회원이 타인 deleted_at 변경은 RLS가 이미 차단.
  --     본인 행이고 본인이 active 회원이면 본인 deleted_at 세팅 허용(탈퇴), 그 외는 officer만.
  if new.deleted_at is distinct from old.deleted_at then
    if not (v_is_officer or v_is_self) then
      new.deleted_at := old.deleted_at;
    end if;
  end if;

  -- (7) email: auth.users 가 source of truth. profile.email 직접 변경 금지(officer도).
  --     이메일 변경은 supabase.auth.updateUser로만.
  if new.email is distinct from old.email then
    if not v_is_admin then
      new.email := old.email;
    end if;
  end if;

  -- (8) id: 절대 변경 불가.
  if new.id is distinct from old.id then
    new.id := old.id;
  end if;

  return new;
end;
$$;

comment on function public.guard_profiles_secure_update()
  is 'profiles BEFORE UPDATE 가드: role/status/approved_*/rejected_*/is_anonymous_placeholder/deleted_at/email 의 무단 변경 차단. 권한별로 새 값을 옛 값으로 되돌린다.';

drop trigger if exists trg_profiles_secure_update on public.profiles;
create trigger trg_profiles_secure_update
  before update on public.profiles
  for each row execute function public.guard_profiles_secure_update();
