-- =====================================================================
-- seed.sql — 개발용 시드 데이터
-- 사용법: supabase db reset 후 자동 실행. 또는 `psql -f seed.sql`.
-- 주의: auth.users에 직접 insert하는 것은 개발 환경 한정.
-- 실제 환경에서는 Supabase Auth API로 가입한 뒤 profiles만 update할 것.
-- =====================================================================

-- 1) 익명 placeholder 계정 (탈퇴 회원의 글 FK 보존용) -----------------
-- auth.users.id를 '00000000-0000-0000-0000-000000000001'로 고정.
insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, aud, role)
values (
  '00000000-0000-0000-0000-000000000001',
  'anonymous@local',
  crypt('not_for_login', gen_salt('bf')),
  now(), now(), now(),
  jsonb_build_object('name', '(탈퇴회원)'),
  'authenticated', 'authenticated'
)
on conflict (id) do nothing;

update public.profiles
set is_anonymous_placeholder = true,
    name = '(탈퇴회원)',
    status = 'withdrawn'
where id = '00000000-0000-0000-0000-000000000001';

-- 2) 데모 사용자 5명 (admin 1, officer 1, member 3) -------------------
-- 비밀번호는 모두 'password123' (개발 전용)
do $$
declare
  v_admin_id   uuid := '00000000-0000-0000-0000-0000000000a1';
  v_officer_id uuid := '00000000-0000-0000-0000-0000000000b1';
  v_member1_id uuid := '00000000-0000-0000-0000-0000000000c1';
  v_member2_id uuid := '00000000-0000-0000-0000-0000000000c2';
  v_member3_id uuid := '00000000-0000-0000-0000-0000000000c3';
  v_pw         text := crypt('password123', gen_salt('bf'));
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, aud, role)
  values
    (v_admin_id,   'admin@phd.local',   v_pw, now(), now(), now(), jsonb_build_object('name','김관리','student_id','2020-A-001','cohort_year','2020','lab','AI Lab'),'authenticated','authenticated'),
    (v_officer_id, 'officer@phd.local', v_pw, now(), now(), now(), jsonb_build_object('name','이임원','student_id','2022-B-002','cohort_year','2022','lab','NLP Lab'),'authenticated','authenticated'),
    (v_member1_id, 'm1@phd.local',      v_pw, now(), now(), now(), jsonb_build_object('name','박지민','student_id','2026-C-101','cohort_year','2026','lab','CV Lab'),'authenticated','authenticated'),
    (v_member2_id, 'm2@phd.local',      v_pw, now(), now(), now(), jsonb_build_object('name','최수아','student_id','2024-C-201','cohort_year','2024','lab','HCI Lab'),'authenticated','authenticated'),
    (v_member3_id, 'm3@phd.local',      v_pw, now(), now(), now(), jsonb_build_object('name','정현우','student_id','2023-C-202','cohort_year','2023','lab','Robotics Lab'),'authenticated','authenticated')
  on conflict (id) do nothing;

  -- profiles는 트리거가 만들었지만 status/role을 활성화/승격
  update public.profiles set role = 'admin',   status = 'active', approved_at = now() where id = v_admin_id;
  update public.profiles set role = 'officer', status = 'active', approved_at = now() where id = v_officer_id;
  update public.profiles set role = 'member',  status = 'active', approved_at = now() where id = v_member1_id;
  update public.profiles set role = 'member',  status = 'active', approved_at = now() where id = v_member2_id;
  update public.profiles set role = 'member',  status = 'active', approved_at = now() where id = v_member3_id;

  -- 3) 공지 2건
  insert into public.notices (title, body_md, pinned, created_by) values
    ('[필독] 2026-1학기 원우회 일정 안내', '## 일정\n- 개강총회 3/10\n- 봄 MT 4/20', true, v_officer_id),
    ('회비 납부 안내', '계좌: 우리은행 1002-XXX. 학기당 30,000원.', false, v_officer_id);

  -- 4) 게시글 2건 + 댓글 1건
  with p1 as (
    insert into public.posts (category, title, body_md, created_by)
    values ('general', '신입생 환영합니다!', '궁금한 점 있으면 댓글로 남겨주세요.', v_officer_id)
    returning id
  )
  insert into public.comments (post_id, body_md, created_by)
  select id, '환영해주셔서 감사합니다 :)', v_member1_id from p1;

  insert into public.posts (category, title, body_md, created_by) values
    ('question', '랩 세미나실 예약은 어떻게 하나요?', '학과 사이트 어디서 예약하는지 알려주세요!', v_member1_id);

  -- 5) 일정 1건
  insert into public.events (title, description_md, location, starts_at, ends_at, created_by) values
    ('2026-1학기 개강총회', '신입생 환영회 겸 개강 총회', '공학관 101호',
     '2026-03-10 18:30:00+09', '2026-03-10 21:00:00+09', v_officer_id);

  -- 6) 회비 항목 1건 (트리거가 모든 active 회원에게 unpaid 행 자동 생성)
  insert into public.dues_term (label, amount_krw, due_date, description_md, created_by) values
    ('2026-1학기 회비', 30000, '2026-04-30',
     '입금 계좌: 우리은행 1002-XXX (예금주: 원우회). 입금자명에 학번_이름 기재.',
     v_officer_id);

  -- 7) 데모: officer는 이미 납부한 것으로 표시
  update public.dues_payment
  set status = 'paid', paid_at = now(), memo = '시드 데이터', updated_by = v_officer_id
  where member_id = v_officer_id;
end $$;
