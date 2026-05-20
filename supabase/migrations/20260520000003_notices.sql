-- =====================================================================
-- 20260520000003_notices.sql
-- 목적: 공지(notices) 테이블
-- US-10, US-11 (P0) / US-12 pin, US-13 푸시 (P1)
-- =====================================================================

create table if not exists public.notices (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 120),
  body_md     text not null check (char_length(body_md) <= 20000),  -- 마크다운 본문
  pinned      boolean not null default false,                         -- P1 핀 고정
  pinned_at   timestamptz,
  created_by  uuid references auth.users(id) on delete set null,     -- 작성자가 탈퇴해도 공지 유지
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists notices_created_at_desc_idx on public.notices (created_at desc) where deleted_at is null;
create index if not exists notices_pinned_idx          on public.notices (pinned, created_at desc) where deleted_at is null;
create index if not exists notices_created_by_idx      on public.notices (created_by);
-- 한국어 검색은 P1; P0는 단순 simple 토크나이저 + GIN
create index if not exists notices_fts_idx on public.notices
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(body_md, '')));

drop trigger if exists trg_notices_updated_at on public.notices;
create trigger trg_notices_updated_at
  before update on public.notices
  for each row execute function public.set_updated_at();

comment on table public.notices is '공지 글. 임원/관리자만 작성. 활성 회원 모두 열람.';
