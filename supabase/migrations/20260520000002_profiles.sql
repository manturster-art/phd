-- =====================================================================
-- 20260520000002_profiles.sql
-- 목적: profiles 테이블 (auth.users 1:1 확장) + 가입 트리거 + 익명 placeholder
-- US-01, US-03, US-50 (가입/프로필/승인)
-- =====================================================================

-- 1) profiles 테이블 -----------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,                         -- auth.users.email 캐싱 (RLS 빠른 조회용)
  name            text not null check (char_length(name) between 1 and 40),
  student_id      text,                                  -- 학번 (가입 시 입력, 변경 거의 없음)
  cohort_year     int check (cohort_year between 1990 and 2100), -- 입학년도
  lab             text,                                  -- 연구실 (선택)
  phone           text,                                  -- 연락처 (본인+임원만 노출)
  role            user_role       not null default 'member',
  status          profile_status  not null default 'pending',
  approved_at     timestamptz,
  approved_by     uuid references auth.users(id) on delete set null,
  rejected_reason text,
  is_anonymous_placeholder boolean not null default false, -- 탈퇴 회원 보존용 placeholder 표시
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz                            -- 소프트 삭제 (탈퇴 30일 유예)
);

-- 이메일은 auth.users에서 unique 보장되지만, profiles에서도 빠른 lookup용 unique 유지
create unique index if not exists profiles_email_uniq on public.profiles (lower(email)) where deleted_at is null;
-- 학번 중복 방지 (탈퇴 placeholder 제외)
create unique index if not exists profiles_student_id_uniq on public.profiles (student_id)
  where student_id is not null and deleted_at is null and is_anonymous_placeholder = false;

create index if not exists profiles_status_idx on public.profiles (status);
create index if not exists profiles_role_idx   on public.profiles (role);
create index if not exists profiles_cohort_idx on public.profiles (cohort_year);
-- 디렉토리 검색용 (P1)
create index if not exists profiles_name_trgm  on public.profiles using gin (name gin_trgm_ops);

-- updated_at 자동 갱신
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

comment on table  public.profiles is '회원 프로필. auth.users(id)와 1:1. status=pending → 임원 승인 후 active.';
comment on column public.profiles.is_anonymous_placeholder
  is '탈퇴/익명화 처리용 placeholder 계정. 게시글 작성자 FK를 보존하기 위해 사용. 단 1행만 존재 (id 고정).';

-- 2) auth.users 생성 시 profiles 자동 생성 트리거 -----------------------
-- 가입 신청 직후 profiles row 자동 생성. status는 'pending'으로 시작.
-- 이름/학번 등은 가입 폼에서 별도 API로 update 한다.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, student_id, cohort_year, lab, phone, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'student_id',
    nullif(new.raw_user_meta_data->>'cohort_year', '')::int,
    new.raw_user_meta_data->>'lab',
    new.raw_user_meta_data->>'phone',
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- 3) 익명 placeholder 계정 ----------------------------------------------
-- 탈퇴 회원의 게시글 작성자를 가리키는 고정 ID.
-- auth.users에는 실 계정 없이 profiles만 존재하면 FK 위반.
-- 따라서 auth.users에 직접 시드하지 않고, 별도 SECURITY DEFINER 함수로 안전 생성하거나
-- supabase/seed.sql에서 한번만 만든다. 여기서는 ID만 상수로 노출.
-- 사용 예: update posts set created_by = public.anonymous_user_id() where created_by = <탈퇴자>;
create or replace function public.anonymous_user_id()
returns uuid
language sql
immutable
as $$
  select '00000000-0000-0000-0000-000000000001'::uuid;
$$;

comment on function public.anonymous_user_id()
  is '탈퇴 회원의 게시글/댓글 FK를 옮겨놓을 익명 placeholder profile의 id (seed.sql에서 생성).';
