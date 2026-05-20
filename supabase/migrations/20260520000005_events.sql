-- =====================================================================
-- 20260520000005_events.sql
-- 목적: 일정(events) + RSVP(event_rsvps)
-- US-30, US-31 (P0) / US-32 RSVP, US-33 CSV (P1)
-- =====================================================================

-- 1) events --------------------------------------------------------------
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) between 1 and 120),
  description_md text check (char_length(description_md) <= 10000),
  location     text,
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  is_all_day   boolean not null default false,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  constraint events_time_order_chk check (ends_at is null or ends_at >= starts_at)
);

create index if not exists events_starts_at_idx       on public.events (starts_at) where deleted_at is null;
create index if not exists events_starts_at_desc_idx  on public.events (starts_at desc) where deleted_at is null;
create index if not exists events_created_by_idx      on public.events (created_by);

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

comment on table public.events is '원우회 행사 일정. 임원/관리자만 등록. 활성 회원 모두 열람.';

-- 2) event_rsvps (P1이지만 스키마는 P0에 함께 둠) ----------------------
create table if not exists public.event_rsvps (
  event_id   uuid not null references public.events(id) on delete cascade,
  member_id  uuid not null references auth.users(id) on delete cascade,
  status     rsvp_status not null default 'going',
  note       text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, member_id)
);

create index if not exists event_rsvps_member_idx on public.event_rsvps (member_id);
create index if not exists event_rsvps_status_idx on public.event_rsvps (event_id, status);

drop trigger if exists trg_event_rsvps_updated_at on public.event_rsvps;
create trigger trg_event_rsvps_updated_at
  before update on public.event_rsvps
  for each row execute function public.set_updated_at();

comment on table public.event_rsvps is '행사 참석 여부. 회원당 행사당 1행. (member_id, event_id) 복합 PK.';
