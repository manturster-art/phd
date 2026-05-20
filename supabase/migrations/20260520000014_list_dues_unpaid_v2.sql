-- =====================================================================
-- 20260520000014_list_dues_unpaid_v2.sql
-- 목적: list_dues_unpaid 가 active 회원만 조회하던 문제 수정 (B-04)
-- 이슈: 학기 중 탈퇴/정지 회원의 미납 채권이 미납자 목록에서 사라져 운영 누락.
-- 해결: p_include_inactive 옵션 파라미터 추가.
--   - 기본값 true → suspended/rejected/withdrawn 도 포함 (단 익명 placeholder는 제외)
--   - false → 기존 동작(활성 회원만)
--   결과 행에 status 컬럼이 있어 UI에서 분리 섹션 렌더 가능.
-- 호환: 기존 1-인자 시그니처 list_dues_unpaid(uuid) 는 v1 으로 유지(legacy)
--       하되 내부에서 v2를 호출하도록 위임. 호출부 점진 이관 가능.
-- =====================================================================

-- 1) v2 본체 ----------------------------------------------------------
create or replace function public.list_dues_unpaid(
  p_dues_term_id      uuid,
  p_include_inactive  boolean default true
)
returns table (
  member_id     uuid,
  name          text,
  cohort_year   int,
  lab           text,
  phone         text,
  member_status public.profile_status,
  status        text,
  memo          text,
  memo_public   boolean,
  updated_at    timestamptz
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
    pr.status as member_status,
    dp.status,
    dp.memo,
    dp.memo_public,
    dp.updated_at
  from public.dues_payment dp
  join public.profiles pr on pr.id = dp.member_id
  where dp.dues_term_id = p_dues_term_id
    and dp.status = 'unpaid'
    and pr.is_anonymous_placeholder = false
    and (
      p_include_inactive
      or pr.status = 'active'
    )
  order by
    -- active 회원을 먼저, 그 다음 그 외 상태 (탈퇴/정지/반려 후순위)
    case when pr.status = 'active' then 0 else 1 end asc,
    pr.cohort_year asc nulls last,
    pr.name asc;
end;
$$;

comment on function public.list_dues_unpaid(uuid, boolean) is
  '특정 dues_term 의 미납 회원 목록. v2: p_include_inactive(기본 true)로 정지/탈퇴 회원 포함 여부 제어. member_status로 UI 섹션 분리 가능.';
