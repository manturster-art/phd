-- =====================================================================
-- 20260520000010_profile_status_rejected_enum.sql
-- 목적: profile_status ENUM에 'rejected' 값 추가 (B-01 사전 작업)
-- 이슈: reject_membership RPC가 status='suspended' 사용 → middleware가 "정지"로 분류
--       반려와 정지를 분리 운영하기 위해 'rejected' 별도 상태 신설.
-- 주의: Postgres는 같은 트랜잭션 안에서 새로 추가된 enum 값을 즉시 사용할 수 없다.
--       따라서 enum 추가는 **이 파일에서 단독 실행**하고, 실제 사용(RPC 변경)은
--       다음 마이그레이션 파일(20260520000011_*.sql)에서 한다.
-- =====================================================================

-- ENUM 값 추가는 idempotent하지 않으므로 존재 여부 가드.
do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'profile_status' and e.enumlabel = 'rejected'
  ) then
    alter type public.profile_status add value 'rejected' after 'pending';
  end if;
end $$;

comment on type public.profile_status is
  '프로필 상태: pending(가입대기) → active(활성), rejected(가입반려), suspended(정지), withdrawn(탈퇴).';
