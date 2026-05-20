-- =====================================================================
-- 20260520000008_rls_policies.sql
-- 목적: 모든 public 테이블에 RLS enable + 역할별 정책
-- 권한 매트릭스(PM §4) 강제: 비회원 / 일반회원(active) / 임원(officer+) / 관리자(admin)
-- =====================================================================

-- =====================================================================
-- 0) 모든 테이블 RLS enable
-- =====================================================================
alter table public.profiles      enable row level security;
alter table public.notices       enable row level security;
alter table public.posts         enable row level security;
alter table public.comments      enable row level security;
alter table public.events        enable row level security;
alter table public.event_rsvps   enable row level security;
alter table public.dues_term     enable row level security;
alter table public.dues_payment  enable row level security;
alter table public.notifications enable row level security;
alter table public.attachments   enable row level security;

-- 안전: 모든 정책을 idempotent 하게 재생성하기 위해 drop 먼저 (이름 충돌 방지)
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles','notices','posts','comments','events','event_rsvps',
        'dues_term','dues_payment','notifications','attachments'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- =====================================================================
-- 1) profiles
-- =====================================================================
-- SELECT: 본인은 모든 컬럼. 활성 회원은 다른 active 회원의 공개 정보 조회.
--   (개인정보 가리기는 view 또는 RPC로 처리하길 권장; RLS는 행 단위만 통제)
create policy "profiles_select_self"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "profiles_select_active_members"
  on public.profiles for select to authenticated
  using (
    public.is_active_member()
    and status = 'active'
  );

-- 임원/관리자는 모든 프로필 조회 (pending 승인 큐 포함)
create policy "profiles_select_officer_all"
  on public.profiles for select to authenticated
  using (public.is_officer());

-- INSERT: 트리거(handle_new_auth_user)가 SECURITY DEFINER로 처리.
-- 일반 클라이언트의 직접 insert는 금지(정책 없음 = 차단).

-- UPDATE:
--   본인 — 본인 행만 (단 role/status는 별도 정책에서 차단해야 하므로 column-level은 앱에서 검증)
--   임원 — 다른 프로필의 status를 변경(승인/반려)
--   관리자 — role 변경 가능 (위임)
create policy "profiles_update_self"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_update_officer"
  on public.profiles for update to authenticated
  using (public.is_officer())
  with check (public.is_officer());

-- DELETE: 정책 없음 = 차단. 탈퇴는 soft delete(update deleted_at)로 처리.

-- =====================================================================
-- 2) notices
-- =====================================================================
create policy "notices_select_member"
  on public.notices for select to authenticated
  using (public.is_active_member() and deleted_at is null);

create policy "notices_select_officer_all"
  on public.notices for select to authenticated
  using (public.is_officer());

create policy "notices_insert_officer"
  on public.notices for insert to authenticated
  with check (public.is_officer() and created_by = auth.uid());

create policy "notices_update_officer"
  on public.notices for update to authenticated
  using (public.is_officer())
  with check (public.is_officer());

create policy "notices_delete_officer"
  on public.notices for delete to authenticated
  using (public.is_officer());

-- =====================================================================
-- 3) posts
-- =====================================================================
-- 활성 회원만 조회. 숨김(is_hidden) 글은 작성자 본인과 임원만 볼 수 있음.
create policy "posts_select_member"
  on public.posts for select to authenticated
  using (
    public.is_active_member()
    and deleted_at is null
    and (is_hidden = false or created_by = auth.uid() or public.is_officer())
  );

create policy "posts_insert_member"
  on public.posts for insert to authenticated
  with check (public.is_active_member() and created_by = auth.uid());

-- UPDATE:
--   본인 — 본문 수정
--   임원 — 숨김 토글(은 컬럼 단위 강제 어려우므로 앱 레이어에서 enforce)
create policy "posts_update_self"
  on public.posts for update to authenticated
  using (created_by = auth.uid() and public.is_active_member())
  with check (created_by = auth.uid());

create policy "posts_update_officer"
  on public.posts for update to authenticated
  using (public.is_officer())
  with check (public.is_officer());

create policy "posts_delete_self"
  on public.posts for delete to authenticated
  using (created_by = auth.uid());

create policy "posts_delete_officer"
  on public.posts for delete to authenticated
  using (public.is_officer());

-- =====================================================================
-- 4) comments
-- =====================================================================
create policy "comments_select_member"
  on public.comments for select to authenticated
  using (
    public.is_active_member()
    and deleted_at is null
    and exists (
      select 1 from public.posts p
      where p.id = comments.post_id
        and p.deleted_at is null
        and (p.is_hidden = false or p.created_by = auth.uid() or public.is_officer())
    )
  );

create policy "comments_insert_member"
  on public.comments for insert to authenticated
  with check (
    public.is_active_member()
    and created_by = auth.uid()
    and exists (select 1 from public.posts p where p.id = post_id and p.deleted_at is null)
  );

create policy "comments_update_self"
  on public.comments for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "comments_delete_self"
  on public.comments for delete to authenticated
  using (created_by = auth.uid());

create policy "comments_delete_officer"
  on public.comments for delete to authenticated
  using (public.is_officer());

-- =====================================================================
-- 5) events
-- =====================================================================
create policy "events_select_member"
  on public.events for select to authenticated
  using (public.is_active_member() and deleted_at is null);

create policy "events_select_officer_all"
  on public.events for select to authenticated
  using (public.is_officer());

create policy "events_insert_officer"
  on public.events for insert to authenticated
  with check (public.is_officer() and created_by = auth.uid());

create policy "events_update_officer"
  on public.events for update to authenticated
  using (public.is_officer())
  with check (public.is_officer());

create policy "events_delete_officer"
  on public.events for delete to authenticated
  using (public.is_officer());

-- =====================================================================
-- 6) event_rsvps
-- =====================================================================
-- 회원은 본인 RSVP만 변경. 모든 회원은 누가 참석하는지 조회 가능(소규모 조직 가정).
create policy "rsvps_select_member"
  on public.event_rsvps for select to authenticated
  using (public.is_active_member());

create policy "rsvps_upsert_self"
  on public.event_rsvps for insert to authenticated
  with check (public.is_active_member() and member_id = auth.uid());

create policy "rsvps_update_self"
  on public.event_rsvps for update to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

create policy "rsvps_delete_self"
  on public.event_rsvps for delete to authenticated
  using (member_id = auth.uid());

create policy "rsvps_update_officer"
  on public.event_rsvps for update to authenticated
  using (public.is_officer())
  with check (public.is_officer());

-- =====================================================================
-- 7) dues_term
-- =====================================================================
-- SELECT: 모든 활성 회원이 회비 항목(라벨/금액/마감/설명) 조회 가능.
create policy "dues_term_select_member"
  on public.dues_term for select to authenticated
  using (public.is_active_member() and deleted_at is null);

create policy "dues_term_select_officer_all"
  on public.dues_term for select to authenticated
  using (public.is_officer());

create policy "dues_term_insert_officer"
  on public.dues_term for insert to authenticated
  with check (public.is_officer() and created_by = auth.uid());

create policy "dues_term_update_officer"
  on public.dues_term for update to authenticated
  using (public.is_officer())
  with check (public.is_officer());

create policy "dues_term_delete_officer"
  on public.dues_term for delete to authenticated
  using (public.is_officer());

-- =====================================================================
-- 8) dues_payment
-- =====================================================================
-- SELECT:
--   본인 — 본인 행만 (PM §4: "본인 회비 납부 내역 조회")
--   임원 — 전체
create policy "dues_payment_select_self"
  on public.dues_payment for select to authenticated
  using (member_id = auth.uid() and public.is_active_member());

create policy "dues_payment_select_officer"
  on public.dues_payment for select to authenticated
  using (public.is_officer());

-- INSERT: dues_term 트리거(SECURITY DEFINER)가 자동으로. 임원 수동 추가도 허용.
create policy "dues_payment_insert_officer"
  on public.dues_payment for insert to authenticated
  with check (public.is_officer());

-- UPDATE: 임원만 status/memo/paid_at 변경
create policy "dues_payment_update_officer"
  on public.dues_payment for update to authenticated
  using (public.is_officer())
  with check (public.is_officer() and updated_by = auth.uid());

-- DELETE: 임원만 (실무에서는 잘 안 씀; 보존 우선)
create policy "dues_payment_delete_officer"
  on public.dues_payment for delete to authenticated
  using (public.is_officer());

-- =====================================================================
-- 9) notifications
-- =====================================================================
create policy "notifications_select_self"
  on public.notifications for select to authenticated
  using (recipient_id = auth.uid());

create policy "notifications_update_self"
  on public.notifications for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

create policy "notifications_delete_self"
  on public.notifications for delete to authenticated
  using (recipient_id = auth.uid());

-- INSERT 정책 없음 = 클라이언트 직접 insert 차단. DB 트리거/Edge Function (SECURITY DEFINER)만 가능.

-- =====================================================================
-- 10) attachments
-- =====================================================================
-- 첨부 메타 조회는 소유 객체(notice/post/comment) 조회 권한과 동일하게.
create policy "attachments_select_via_owner"
  on public.attachments for select to authenticated
  using (
    public.is_active_member() and (
      (notice_id is not null and exists (
        select 1 from public.notices n where n.id = notice_id and n.deleted_at is null))
      or (post_id is not null and exists (
        select 1 from public.posts p where p.id = post_id and p.deleted_at is null
          and (p.is_hidden = false or p.created_by = auth.uid() or public.is_officer())))
      or (comment_id is not null and exists (
        select 1 from public.comments c where c.id = comment_id and c.deleted_at is null))
    )
  );

create policy "attachments_insert_uploader"
  on public.attachments for insert to authenticated
  with check (public.is_active_member() and uploaded_by = auth.uid());

create policy "attachments_delete_uploader"
  on public.attachments for delete to authenticated
  using (uploaded_by = auth.uid() or public.is_officer());

-- =====================================================================
-- 11) Storage RLS (attachments / avatars 버킷)
-- =====================================================================
-- storage.objects에 RLS는 기본 활성화되어 있음. 정책만 추가.
drop policy if exists "storage_attachments_read"   on storage.objects;
drop policy if exists "storage_attachments_write"  on storage.objects;
drop policy if exists "storage_attachments_delete" on storage.objects;
drop policy if exists "storage_avatars_read"       on storage.objects;
drop policy if exists "storage_avatars_write"      on storage.objects;

-- attachments 버킷: 활성 회원만 read, 본인 업로드만 write/delete
create policy "storage_attachments_read"
  on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and public.is_active_member());

create policy "storage_attachments_write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments' and public.is_active_member() and owner = auth.uid());

create policy "storage_attachments_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'attachments' and (owner = auth.uid() or public.is_officer()));

-- avatars 버킷: public read, 본인 폴더(`{auth.uid()}/...`)에만 write
create policy "storage_avatars_read"
  on storage.objects for select to public
  using (bucket_id = 'avatars');

create policy "storage_avatars_write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
