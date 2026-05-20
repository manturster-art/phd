-- =====================================================================
-- 20260520000001_init_extensions_and_helpers.sql
-- 목적: 확장(Extensions), 공통 ENUM, 공통 함수/트리거 정의
-- 모든 후속 마이그레이션이 의존하는 기반 레이어
-- =====================================================================

-- 1) Extensions ----------------------------------------------------------
create extension if not exists "pgcrypto";    -- gen_random_uuid()
create extension if not exists "pg_trgm";     -- 이름/제목 부분 일치 검색 (P1 디렉토리)
create extension if not exists "citext";      -- 이메일 등 대소문자 무시 컬럼 (선택적)

-- 2) Shared ENUMs --------------------------------------------------------
-- 회원 역할: 관리자가 가장 강함. 권한 매트릭스(PM §4) 반영.
do $$ begin
  create type user_role as enum ('member', 'officer', 'admin');
exception when duplicate_object then null; end $$;

-- 프로필 상태: 가입 신청 → 활성 → 정지/탈퇴 흐름.
do $$ begin
  create type profile_status as enum ('pending', 'active', 'suspended', 'withdrawn');
exception when duplicate_object then null; end $$;

-- 게시글 카테고리(P1에서 세분화 예정, P0는 'general' 단일 사용 가능).
do $$ begin
  create type post_category as enum ('general', 'question', 'share', 'recruit');
exception when duplicate_object then null; end $$;

-- RSVP 응답.
do $$ begin
  create type rsvp_status as enum ('going', 'not_going', 'maybe');
exception when duplicate_object then null; end $$;

-- 알림 종류 (확장 가능, P0에서는 인앱 알림만 사용).
do $$ begin
  create type notification_kind as enum (
    'notice_published',
    'comment_on_my_post',
    'reply_to_my_comment',
    'event_upcoming',
    'dues_status_changed',
    'membership_approved',
    'membership_rejected'
  );
exception when duplicate_object then null; end $$;

-- 3) updated_at 자동 갱신 트리거 함수 -----------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 4) 권한 헬퍼 함수 ------------------------------------------------------
-- RLS 정책에서 반복적으로 호출되므로 STABLE + SECURITY DEFINER로 정의.
-- profiles 테이블 자기참조 RLS 무한루프를 방지하기 위함.

-- 현재 사용자의 역할 반환 (없으면 null)
create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 현재 사용자의 상태 반환
create or replace function public.current_user_status()
returns profile_status
language sql
stable
security definer
set search_path = public
as $$
  select status from public.profiles where id = auth.uid();
$$;

-- 활성 회원 여부 (가장 많이 쓰이는 가드)
create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and status = 'active'
  );
$$;

-- 임원 이상(임원/관리자) 여부
create or replace function public.is_officer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'active'
      and role in ('officer', 'admin')
  );
$$;

-- 관리자 여부
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'active'
      and role = 'admin'
  );
$$;

comment on function public.current_user_role()   is 'RLS helper: 현재 auth.uid()의 user_role 반환';
comment on function public.current_user_status() is 'RLS helper: 현재 auth.uid()의 profile_status 반환';
comment on function public.is_active_member()    is 'RLS helper: 활성 회원 여부';
comment on function public.is_officer()          is 'RLS helper: 임원/관리자 여부';
comment on function public.is_admin()            is 'RLS helper: 관리자 여부';
