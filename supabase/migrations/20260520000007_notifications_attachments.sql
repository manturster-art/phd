-- =====================================================================
-- 20260520000007_notifications_attachments.sql
-- 목적: 인앱 알림(notifications) + 첨부 파일 메타(attachments) + Storage bucket
-- P0: 인앱 알림만. 푸시는 P1, 이메일은 P2.
-- 첨부는 P2(US-14)이지만 스키마는 미리 정의.
-- =====================================================================

-- 1) notifications -------------------------------------------------------
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  kind         notification_kind not null,
  title        text not null check (char_length(title) between 1 and 120),
  body         text check (body is null or char_length(body) <= 500),
  -- 컨텍스트 객체 참조 (한 쪽만 채워짐 — 다형성 단순 모델)
  notice_id    uuid references public.notices(id) on delete cascade,
  post_id      uuid references public.posts(id)   on delete cascade,
  comment_id   uuid references public.comments(id) on delete cascade,
  event_id     uuid references public.events(id)  on delete cascade,
  dues_payment_id uuid references public.dues_payment(id) on delete cascade,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id, created_at desc) where read_at is null;
create index if not exists notifications_recipient_all_idx
  on public.notifications (recipient_id, created_at desc);

comment on table public.notifications is '인앱 알림. 본인 행만 SELECT/UPDATE 가능. INSERT는 서버(DB 트리거/Edge Function)가 담당.';

-- 2) attachments (P2 공지 첨부, 스키마는 미리) --------------------------
create table if not exists public.attachments (
  id            uuid primary key default gen_random_uuid(),
  storage_path  text not null,                      -- 'attachments/<uuid>/<filename>'
  file_name     text not null,
  mime_type     text,
  size_bytes    bigint check (size_bytes is null or size_bytes >= 0),
  -- 다형성 소유자: 한 쪽만 채워짐
  notice_id     uuid references public.notices(id) on delete cascade,
  post_id       uuid references public.posts(id)   on delete cascade,
  comment_id    uuid references public.comments(id) on delete cascade,
  uploaded_by   uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint attachments_one_owner_chk check (
    (case when notice_id  is not null then 1 else 0 end +
     case when post_id    is not null then 1 else 0 end +
     case when comment_id is not null then 1 else 0 end) = 1
  )
);

create index if not exists attachments_notice_idx  on public.attachments (notice_id)  where notice_id  is not null;
create index if not exists attachments_post_idx    on public.attachments (post_id)    where post_id    is not null;
create index if not exists attachments_comment_idx on public.attachments (comment_id) where comment_id is not null;
create index if not exists attachments_uploaded_by_idx on public.attachments (uploaded_by);

comment on table public.attachments is '첨부파일 메타. 실제 파일은 Supabase Storage `attachments` 버킷에 저장.';

-- 3) Storage 버킷 ------------------------------------------------------
-- 실제 운영 환경에선 Supabase 대시보드/CLI로 생성하지만, 마이그레이션에 idempotent하게 둠.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  false,                                  -- 비공개 (Signed URL 사용)
  10485760,                                -- 10MB
  array['image/png','image/jpeg','image/webp','image/gif','application/pdf']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,                                 -- 2MB
  array['image/png','image/jpeg','image/webp']
)
on conflict (id) do nothing;
