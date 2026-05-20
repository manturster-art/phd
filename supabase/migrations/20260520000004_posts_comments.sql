-- =====================================================================
-- 20260520000004_posts_comments.sql
-- 목적: 게시판 (posts) + 댓글 (comments)
-- US-20, US-21 (P0)
-- =====================================================================

-- 1) posts ---------------------------------------------------------------
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  category     post_category not null default 'general',  -- MVP는 'general' 단일 사용 (P1에서 분기)
  title        text not null check (char_length(title) between 1 and 120),
  body_md      text not null check (char_length(body_md) <= 20000),
  is_hidden    boolean not null default false,            -- 임원 숨김 처리 (P1 US-60)
  hidden_by    uuid references auth.users(id) on delete set null,
  hidden_at    timestamptz,
  comment_count int not null default 0,                    -- 트리거로 동기화
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index if not exists posts_created_at_desc_idx on public.posts (created_at desc) where deleted_at is null;
create index if not exists posts_category_idx        on public.posts (category, created_at desc) where deleted_at is null;
create index if not exists posts_created_by_idx      on public.posts (created_by);
create index if not exists posts_fts_idx on public.posts
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(body_md, '')));

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

comment on table public.posts is '자유 게시판. 활성 회원이 작성/조회. 본인 글만 수정·삭제, 임원은 숨김 처리.';

-- 2) comments ------------------------------------------------------------
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  parent_id   uuid references public.comments(id) on delete cascade,  -- 단일 depth 답글 지원 (P0는 평탄 사용 권장)
  body_md     text not null check (char_length(body_md) between 1 and 2000),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists comments_post_id_idx     on public.comments (post_id, created_at);
create index if not exists comments_parent_id_idx   on public.comments (parent_id);
create index if not exists comments_created_by_idx  on public.comments (created_by);

drop trigger if exists trg_comments_updated_at on public.comments;
create trigger trg_comments_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

-- 3) comment_count 동기화 트리거 ----------------------------------------
create or replace function public.sync_post_comment_count()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  elsif (tg_op = 'UPDATE') then
    -- 소프트 삭제 토글 처리
    if (old.deleted_at is null and new.deleted_at is not null) then
      update public.posts set comment_count = greatest(comment_count - 1, 0) where id = new.post_id;
    elsif (old.deleted_at is not null and new.deleted_at is null) then
      update public.posts set comment_count = comment_count + 1 where id = new.post_id;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_comments_sync_count_iud on public.comments;
create trigger trg_comments_sync_count_iud
  after insert or update of deleted_at or delete on public.comments
  for each row execute function public.sync_post_comment_count();

comment on table public.comments is '게시글 댓글. 단일 깊이 답글(parent_id) 허용. 본인 댓글만 수정·삭제.';
