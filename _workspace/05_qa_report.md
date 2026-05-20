# 05. QA 검증 리포트 — 대학원 원우회 커뮤니티 앱

> 작성자: QA Engineer 에이전트
> 작성일: 2026-05-20
> 입력: 01_pm_requirements.md v0.2 / 02_designer_uiux.md v0.1 / 03_backend_design.md v0.1 / 04_frontend_impl.md v0.1
> 검증 대상: `supabase/migrations/*` + `app/` + `components/` + `lib/`
> 방법: **정적 분석** (실 Supabase 인증/Lighthouse 환경 부재). API↔UI shape, RLS↔UI 분기, DB enum↔UI 옵션을 직접 교차 비교.

## 환경 제약 명시
- Lighthouse·실제 Supabase 인증 환경 사용 불가 → 정적 분석으로 대체.
- `pnpm typecheck` 재확인 결과 **0 errors**.
- 동적 검증(런타임 RLS 강제, 모바일 디바이스, IME) 항목은 코드 리뷰로 추정.

---

## 1. 검증 매트릭스

P0 사용자 스토리 × 검증 카테고리. 상태: **PASS** / **FAIL** / **WARN** (정적 분석상 합리적이나 런타임 검증 필요) / **SKIP** (환경 부재).

| US | 스토리 | 기능 | 권한(RLS↔UI) | 모바일 | 접근성 | 한국어/IME | 종합 |
|----|--------|------|--------------|--------|--------|------------|------|
| US-01 | 가입 신청(승인제) | PASS | PASS | PASS | WARN(label) | PASS | **WARN** |
| US-02 | 로그인 | PASS | PASS | PASS | PASS | PASS | **PASS** |
| US-03 | 프로필 등록·수정 | PASS | WARN(role/status 직접 update 차단 부재) | PASS | PASS | PASS | **WARN** |
| US-10 | 임원 공지 CRUD | PASS | PASS | PASS | WARN(ConfirmDialog 포커스 트랩) | PASS | **WARN** |
| US-11 | 공지 목록·상세 | PASS | PASS | PASS | PASS | PASS | **PASS** |
| US-20 | 게시판 글 CRUD | WARN(글 수정 라우트 부재) | PASS | PASS | PASS | PASS | **WARN** |
| US-21 | 댓글 작성·삭제 | FAIL(댓글 삭제 UI 미연결) | WARN(comment delete RLS+routing 누락) | PASS | PASS | PASS | **FAIL** |
| US-30 | 일정 등록 | PASS | PASS | PASS | PASS | PASS | **PASS** |
| US-31 | 일정 목록·캘린더 | PASS | PASS | PASS | WARN(SegmentedControl role=tab인데 tabpanel 누락) | PASS | **WARN** |
| US-40 | 회비 항목 CRUD | PASS | PASS | PASS | PASS | PASS | **PASS** |
| US-41 | 내 납부 내역 | PASS | PASS | PASS | WARN(메모 공개 정책 미구현) | PASS | **WARN** |
| US-42 | 임원 납부 상태 토글+메모 | WARN(memo 공개 분리 부재, partial 미노출) | PASS | PASS | PASS | PASS | **WARN** |
| US-43 | 미납자 목록 | WARN(active 회원만, 정지/탈퇴 미반영) | PASS | PASS | PASS | PASS | **WARN** |
| US-50 | 가입 승인/반려 | FAIL(반려 시 status=suspended → 로그인 차단됨) | FAIL(반려와 정지 구분 불가) | PASS | PASS | PASS | **FAIL** |

성능(LCP), Lighthouse, 실 RLS 거부 시나리오는 SKIP.

---

## 2. 경계면 버그 목록 (우선순위 P0/P1/P2)

### P0 (즉시 수정 권장 — 사용자 영향 또는 보안)

#### B-01. 반려된 회원이 `suspended`로 분류되어 로그인 차단 — `reject_membership` ↔ middleware
- 명세: PM §3.1 US-50 "임원이 가입 신청자를 승인/반려한다."
- 현황:
  - `supabase/migrations/20260520000009_rpc_helpers.sql:94` — `update public.profiles set status = 'suspended', rejected_reason = p_reason ...`
  - `lib/supabase/middleware.ts:83-88` — `status === 'suspended'` 이면 `/login?reason=suspended` 강제 리다이렉트
  - `app/(auth)/login/page.tsx:17-20` — "정지된 계정입니다. 임원에게 문의해주세요." 안내만 표시 → **반려 사유 표시 안 됨**
- 영향: 반려된 신청자가 "정지" 메시지를 보고 혼란. 또한 차후 재가입을 위한 데이터 흐름(같은 이메일로 재가입 시 `auth.users` 충돌)이 정의되지 않음.
- 권장: `profile_status` enum에 `'rejected'` 추가하거나(Backend), middleware에서 `rejected_reason` 유무로 분기하여 별도 안내 페이지(SCR-신설)로 라우팅(Frontend). PM이 정책 결정 필요.

#### B-02. 본인 댓글 삭제 UI 미연결 — DB·RLS는 허용하나 트리거가 없음
- 명세: `components/post/CommentItem.tsx:7-9` — `onDelete?: () => void` props 정의됨
- 현황: `app/(main)/board/[id]/page.tsx:50-57` — `<CommentItem ... isMine={profile?.id === c.created_by} />` 호출 시 **`onDelete`를 넘기지 않음**
- 영향: P0 US-21 "댓글 작성·삭제" 중 삭제 동작 불가. RLS는 `comments_delete_self` (rls_policies.sql:168-170)로 허용되고 API에 `deleteComment` (lib/api/posts.ts:120) 함수도 존재하지만 UI에서 호출되지 않음.
- 권장: 게시글 상세 페이지에서 본인 댓글 삭제 버튼을 활성화. 삭제 시 낙관적 업데이트 + `router.refresh()`.

#### B-03. `dues_payment.memo_public` 컬럼 부재 → 메모 노출 정책 위반 위험
- 명세:
  - Designer `02_designer_uiux.md:417` — "☐ 회원에게 메모 공개" 체크박스
  - Designer `02_designer_uiux.md:969` — "회비 메모는 '공개' 체크 안 한 경우 회원 화면(SCR-050)에 노출 금지"
- 현황:
  - `supabase/migrations/20260520000006_dues.sql:45` — `memo text` 단일 컬럼
  - `lib/api/dues.ts:124` — `listMyDues`가 모든 메모를 그대로 조회
  - `components/dues/DuesHistoryCard.tsx:23-25` — `row.memo`를 무조건 회원 화면에 렌더
- 영향: 임원이 회원 내부용 메모(예: "추후 면제 요청 가능성, 면담 필요")를 남기면 회원이 그대로 봄. **개인정보·신뢰 이슈**.
- 권장: Backend가 `memo_public boolean default false` 추가 + RLS view 또는 SECURITY DEFINER 함수로 회원 화면에는 `memo_public=true`인 메모만 노출. 또는 `memo_private` / `memo_public` 두 컬럼 분리.

#### B-04. `list_dues_unpaid` RPC가 `active` 회원만 → 정지/탈퇴 회원 미납 누락
- 현황: `supabase/migrations/20260520000009_rpc_helpers.sql:45-46` — `where dp.dues_term_id = ... and dp.status = 'unpaid' and pr.status = 'active'`
- 영향: 학기 중 회원이 탈퇴/정지 처리되면, 해당 회원의 미납 채권이 미납자 목록에서 사라져 운영 누락 가능. 또한 `dues_payment.member_id`는 `on delete restrict`이므로 행은 보존되지만 RPC가 가림.
- 권장: 임원 운영 정책 확인 후 (a) 정지/탈퇴 회원 별도 섹션 표시 또는 (b) 필터 옵션 추가. PM 정책 결정 필요.

#### B-05. `profiles.role` / `profiles.status` 직접 update 차단 부재 → 권한 상승 가능성
- 명세: Backend `03_backend_design.md:436-437` — "RLS 정책 `profiles_update_self`가 with check에 컬럼 제한이 없음. 앱 레이어 검증 필요 또는 column-level RLS 추가."
- 현황:
  - `supabase/migrations/20260520000008_rls_policies.sql:66-69` — `profiles_update_self`는 단지 `id = auth.uid()` 만 강제 → 본인 행의 `role`/`status`를 임의 값으로 update 가능
  - `lib/api/members.ts:63-69` `updateMyProfile`은 안전하지만 클라이언트가 직접 `supabase.from('profiles').update({ role: 'admin' })` 호출하면 RLS가 통과
- 영향: **권한 상승(Privilege Escalation) 취약점**. 일반회원이 자신을 admin으로 승격 가능. UI 경로는 없지만 신뢰 클라이언트가 아닌 한 누구나 시도 가능.
- 권장: Backend가 column-level grant 또는 트리거(`before update`)로 `role`/`status` 변경을 admin/officer만 허용. 가장 빠른 임시조치는 `before update` 트리거로 `auth.uid()`가 `is_admin()` 아닐 때 `new.role := old.role; new.status := old.status;` 강제.

---

### P1 (다음 스프린트)

#### B-06. `dues_term` 정렬 키 부재 → 학기 자유 라벨 혼재 시 정렬 깨짐
- 명세: Designer 부록 `02_designer_uiux.md:983` — "year:int + term:int(1|2) 추가 권장"
- 현황: `supabase/migrations/20260520000006_dues.sql:14` — `label text UNIQUE`만 존재. `lib/api/dues.ts:60` — `order('created_at', { ascending: false })`로 우회 정렬
- 영향: "2024-가을", "2025-1학기" 등 라벨 자유도 발휘 시 사용자 기대 순서와 불일치. SCR-050(내 납부 내역) 카드 순서 혼란.
- 권장: Backend 마이그레이션에 `year int`, `term int` 추가 + UNIQUE(year, term) 보강. 기존 데이터는 라벨 파싱 백필.

#### B-07. 미들웨어 매 요청마다 `profiles` 조회 → N+1 성능 우려
- 현황: `lib/supabase/middleware.ts:69-89` — 모든 비공개 경로에서 `select status` 쿼리 실행. 정적 자원은 matcher가 제외하지만 RSC/액션 요청도 모두 해당.
- 영향: 회원 200명 가정에서 P0는 문제 없으나, 페이지 뷰 수가 적어도 모든 요청에 RTT 1회 추가됨 (LCP·페이지 전환 < 300ms 목표에 영향).
- 권장: status를 JWT custom claim에 인코딩(승인 시 `auth.users.app_metadata.status` 업데이트) 후 middleware는 토큰만 읽도록.

#### B-08. supabase-js v2.106 ↔ 수동 Database 타입 정합성 부족 → `as any` 다수
- 현황: `lib/api/*.ts` 전체에서 `(supabase.from(...) as any)`, `(supabase as any).rpc(...)` 다수 (notices.ts:64, dues.ts:91, members.ts:47, posts.ts:72, events.ts:65, notifications.ts:32 등)
- 영향: 컬럼명 오타·잘못된 Insert/Update payload가 타입체크를 통과해버려 런타임 에러로만 잡힘. QA 입장에서 **경계면 검증 신뢰도 저하**의 근본 원인.
- 권장: 실 Supabase 프로젝트 셋업 후 `supabase gen types typescript`로 자동 생성 타입 교체. 임시로 `Insert`/`Update` 헬퍼 타입을 명시적으로 import해 캐스트 제거 가능.

#### B-09. `partial` 회비 상태가 enum/Badge에는 있으나 편집 시트에 없음
- 현황:
  - `supabase/migrations/20260520000006_dues.sql:43` — `check (status in ('unpaid','paid','exempt','partial'))`
  - `components/dues/DuesStatusBadge.tsx:14,20` — `partial`도 라벨/아이콘 정의됨
  - `components/dues/DuesEditSheet.tsx:24-28` — `STATUS_OPTIONS`에 `partial` 누락 → 임원이 부분납부로 설정 불가
- 영향: DB에 partial 상태인 행이 (백필 외 경로로) 만들어지면 UI에서 임원이 다시 paid/unpaid/exempt로만 수정 가능. 일관성 결함.
- 권장: PM 결정 — partial을 P0에 포함하려면 시트에 4번째 옵션 추가 + `paid_amount_krw` 입력 필드 노출. 제외하려면 enum에서 빼거나 Badge에서 unreachable로 처리.

#### B-10. `comment_count` 동기화는 트리거로 OK, 그러나 UI는 `router.refresh()` 의존 → 일시 불일치 가능
- 현황: `components/post/CommentComposer.tsx:31` — 댓글 등록 후 `router.refresh()` → 서버에서 다시 페치. 트리거(`sync_post_comment_count`, posts_comments.sql:79-82)는 동기 실행이므로 SELECT 시점에는 최신값이지만, 낙관적 업데이트는 없음.
- 영향: 네트워크 지연 시 사용자가 "댓글 등록 → 카운트 안 늘어남" 시각적 어색함. 정합성 자체는 보장됨.
- 권장: 댓글 영역만 client 상태로 관리하고 낙관적 push.

#### B-11. 게시글 수정 라우트 부재 — Frontend 매트릭스 매핑에도 없음
- 명세: Designer `02_designer_uiux.md:46` — `/board/[id]/edit` (본인만)
- 현황: `app/(main)/board/` 디렉토리에 `edit` 디렉토리 없음. `lib/api/posts.ts`에도 `updatePost` 미존재. PostMenu(`app/(main)/board/[id]/PostMenu.tsx`)에는 삭제만.
- 영향: 본인 게시글 수정 불가. PM US-20 "글 작성·조회·삭제" 명시는 수정 미포함이라 해석 가능하나 Designer 명세 위반.
- 권장: PM 결정 — 수정을 P0에 포함하려면 추가. 아니라면 Designer 명세 갱신.

#### B-12. ConfirmDialog/Sheet 포커스 트랩 부재
- 현황:
  - `components/ui/Sheet.tsx:14-26` — `onKeyDown` Escape만 처리, 포커스 트랩/복귀 없음
  - `components/ui/ConfirmDialog.tsx` (미열람이지만 동일 구조 추정)
  - `components/admin/ApprovalRequestCard.tsx:85-102` — 반려 사유 모달도 native focus trap 없음
- 영향: 키보드 사용자가 모달 외부 요소로 Tab 이탈, 모달 닫힘 후 트리거 요소로 포커스 복귀 안 됨. Designer §7.3 체크리스트("focus trap, 닫힐 때 트리거 요소로 복귀") 위반.
- 권장: `inert` 속성 + `tabindex` 관리 또는 `focus-trap-react` 도입.

#### B-13. SegmentedControl `role="tablist"` 사용했으나 `tabpanel` 부재
- 현황: `components/ui/SegmentedControl.tsx:26,37-39` — `role="tablist"`/`role="tab"`/`aria-selected`만 표시하고 연결된 `aria-controls`/`tabpanel`이 없음. CalendarClient/DuesAdminClient에서 단순 필터 컨트롤로 사용됨.
- 영향: 스크린리더가 tab UI로 해석하여 사용자 기대(다음 tab으로 점프, panel 인식)와 어긋남.
- 권장: 단순 필터/세그먼트라면 `role="radiogroup"` + `role="radio"` + `aria-checked`로 변경. tab UI로 유지하려면 `aria-controls` + panel 마크업 추가.

---

### P2 (백로그)

#### B-14. CalendarGrid의 KST 변환이 UTC offset 수동 가감 — DST/타임존 변경 시 취약
- 현황: `components/event/CalendarGrid.tsx:46-48`, `app/(main)/calendar/CalendarClient.tsx:35-37` — `new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10)`
- 영향: 한국은 DST 없으므로 P0에서는 동작. 그러나 시스템 시각이 UTC가 아닐 때 의도와 다른 결과 가능.
- 권장: `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })` 사용해 명시적 KST 날짜 추출.

#### B-15. 회비 항목 삭제 시 dues_payment cascade — 운영 사고 위험
- 현황: `supabase/migrations/20260520000006_dues.sql:40` — `on delete cascade`. ConfirmDialog는 있으나 "관련된 모든 회원의 납부 기록이 함께 삭제됩니다" 경고만.
- 영향: 임원이 실수로 학기 항목을 삭제하면 200×N행 영구 삭제. 복구 어려움.
- 권장: dues_term을 soft delete(`deleted_at`)로만 처리하고 hard delete 자체를 RPC로만 노출, 또는 dues_payment를 cascade가 아니라 set null + 운영 정리 트리거.

#### B-16. `cohort_year` 폼 input — 신입년도 vs 학번 혼동
- 현황:
  - `app/(auth)/signup/SignupForm.tsx:88` — `<TextField label="입학년도" type="number" ... />`
  - `lib/types/database.ts:42` — `cohort_year: number | null`
  - DB 제약: `check (cohort_year between 1990 and 2100)` (profiles.sql:14)
- 영향: 학번이 4자 이상 숫자(zod schema)와 cohort_year(4자 연도)가 폼에서 모두 숫자 input이라 사용자가 헷갈릴 가능성. 큰 문제 아님.

#### B-17. `pinned` 정렬 시 nulls 처리 — 결과적으로 동작
- 현황: `lib/api/notices.ts:31` — `.order('pinned', { ascending: false })` 후 `.order('created_at', { ascending: false })`. `pinned`는 boolean NOT NULL이므로 동작. OK.

#### B-18. `formatDateShort` 정규식이 `2026. 05. 20` 같은 한국어 출력에 의존
- 현황: `lib/utils/format.ts:38` — `DATE_FMT.format(d).replace(/\.\s?/g, '.').replace(/\.$/, '')`
- 영향: Node/브라우저 ICU 버전에 따라 `Intl` 출력 형식이 미세하게 다를 수 있음(예: NBSP 사용). 한국어 ko-KR은 보통 안정적이지만 엣지 케이스 존재 가능.
- 권장: `formatToParts()`로 명시적 조립.

---

## 3. RLS/권한 회로 결함 (DB정책 ↔ UI분기 매트릭스)

### 3.1 정책 단위 매트릭스

| 액션 | DB 정책 | UI 분기 | 일치 |
|------|--------|---------|------|
| 공지 작성 | `notices_insert_officer` (rls:89-91) `is_officer()` + `created_by=auth.uid()` | `notices/new/page.tsx:9-11` redirect if not officer, FAB 숨김 (notices/page.tsx:28) | ✓ |
| 공지 수정/삭제 | `notices_update_officer`/`delete_officer` (rls:93-100) | NoticeMenu는 isOfficer일 때만(notices/[id]/page.tsx:23) | ✓ |
| 게시글 작성 | `posts_insert_member` (rls:114-116) active member + created_by=self | board/new — 별도 권한 가드 없으나 layout이 active 보장 | ✓ |
| 게시글 본인 수정 | `posts_update_self` (rls:121-124) | **UI 라우트 없음 — B-11** | ✗ |
| 게시글 본인 삭제 | `posts_delete_self` (rls:131-133) | PostMenu(본인만 표시 — board/[id]/page.tsx:32) | ✓ |
| 게시글 타인 삭제(임원) | `posts_delete_officer` (rls:135-137) | **UI 분기 없음** — 임원이 타인 글 삭제 메뉴 미노출 | ✗ (UI 미구현) |
| 게시글 숨김 토글 | `posts_update_officer` (rls:126-129) — 컬럼 제한 없이 임원이 모든 컬럼 수정 가능 | **UI 미구현** | ✗ (UI 미구현) |
| 댓글 작성 | `comments_insert_member` (rls:155-161) | CommentComposer (board/[id]/page.tsx:63) | ✓ |
| 댓글 본인 삭제 | `comments_delete_self` (rls:168-170) | **CommentItem.onDelete 미연결 — B-02** | ✗ |
| 댓글 임원 삭제 | `comments_delete_officer` (rls:172-174) | **UI 미구현** | ✗ (UI 미구현) |
| 일정 등록/수정/삭제 | `events_*_officer` | calendar/new redirect (FAB 임원만), EventMenu isOfficer | ✓ |
| 회비 항목 CRUD | `dues_term_*_officer` (rls:238-249) | DuesItemEditor 페이지 isOfficer redirect | ✓ |
| 회비 납부 상태 변경 | `dues_payment_update_officer` (rls:271-274) with check `updated_by=auth.uid()` | DuesEditSheet save가 officerId 전달 (DuesEditSheet.tsx:49 → updateDuesPayment에서 updated_by 세팅) | ✓ |
| 회비 본인 조회 | `dues_payment_select_self` (rls:257-259) | listMyDues가 `eq('member_id', userId)` (dues.ts:125) — 클라이언트 필터+RLS 이중 보장 | ✓ |
| 회비 매트릭스 조회 (임원) | `dues_payment_select_officer` (rls:261-263) | DuesAdminClient 페이지 isOfficer redirect | ✓ |
| 가입 승인/반려 | `approve_membership`/`reject_membership` RPC가 `is_officer()` 자체 검증 (rpc:62,89) | approvals/page.tsx isOfficer redirect | ✓ (단 B-01 분리 이슈) |
| 임원 권한 위임 | `grant_officer`/`revoke_officer` RPC가 `is_admin()` 검증 (rpc:139,151) | **UI 미구현 — Designer SCR-072 placeholder만** | ✗ (P1) |
| `profiles.role`/`status` 직접 update | **차단 안 됨 — B-05** | UI에서는 호출 안 함 | ✗ |
| 알림 본인 조회/읽음 | `notifications_*_self` (rls:284-295) | **UI 미구현 — P1** | (UI 없음) |
| 알림 INSERT | 정책 없음 = 차단. SECURITY DEFINER 트리거/RPC만 가능 | 알림 생성은 `approve_membership`/`reject_membership` RPC가 직접 insert | ✓ |
| Storage attachments | rls:336-346 활성회원 read, 본인 owner write | **UI 미구현 — P2** | (UI 없음) |

### 3.2 결함 요약

1. **B-05 권한 상승** — profiles.role/status 직접 update 차단 부재. P0 보안.
2. **B-02 댓글 본인 삭제 UI 미연결** — DB·API는 있으나 호출 안 됨. P0.
3. **B-11 게시글 본인 수정 라우트 부재** — DB는 허용. P1.
4. **모더레이션 UI 전반 미구현** — 임원의 타인 게시글 삭제/숨김 토글/타인 댓글 삭제. PM 기준 P1(US-60).

### 3.3 RLS 이슈 — `notices_select_officer_all`이 deleted_at 조건 없음
- `rls_policies.sql:85-87` — 임원은 삭제된 공지도 조회 가능 (의도일 수 있으나 UI는 항상 `is('deleted_at', null)` 필터 — notices.ts:31,46 → 결과 동일). 일관성을 위해 의도 문서화 필요.

### 3.4 RLS 이슈 — `dues_payment_select_self`가 active 회원만
- `rls_policies.sql:257-259` — `member_id = auth.uid() and is_active_member()`. 정지/탈퇴 회원이 자신의 과거 납부 내역을 조회 못함. 단 정지/탈퇴는 middleware에서 차단되므로 실제 영향 없음. 정책으로는 OK.

---

## 4. 모바일/PWA 정적 검증

### 4.1 360px 가로 스크롤 위험
- **DuesMatrixTable** (`components/dues/DuesMatrixTable.tsx`) — 5컬럼 테이블. `overflow-x-auto` 적용되어 있고 `md:hidden` 분기로 데스크톱에서만 노출 → **OK**.
- **AppBar 제목** — `truncate` 적용됨 (AppBar.tsx:41). 긴 제목(예: "미납자 · 2026-가을학기 회비") 처리 OK.
- **DuesAdminClient의 SegmentedControl 4탭** (전체/납부/미납/면제) — 360px에서 `min-h-[44px]`이지만 각 셀 폭 약 80px. 텍스트는 들어가나 빠듯. **WARN**.
- **TextField rightSlot** (LoginForm 비밀번호 토글) — input flex 처리되어 OK.
- 회비 EditSheet 상태 3버튼 — `flex-1` 분배, OK.

### 4.2 manifest (`app/manifest.ts`)
- 필수 필드 — name, short_name, start_url, display, icons ✓
- icons 3종(192/512/512 maskable) 정의되어 있으나 **실제 PNG 파일은 placeholder** (Frontend §6 메모). 배포 전 교체 필수.
- `theme_color`, `background_color`, `lang: 'ko'`, `orientation: 'portrait'` ✓
- **누락 권장**: `categories: ['social', 'productivity']`, `id` (PWA 식별자), `scope` (기본은 start_url 디렉토리)

### 4.3 서비스 워커 (`public/sw.js`)
- Network-first + cache fallback — GET only, 동일 origin only. 기본 동작 OK.
- **이슈**: `caches.match` 결과가 undefined일 때 처리 없음 — 오프라인 + 미캐시 페이지는 그냥 에러 응답. 폴백 페이지(`/offline`) 권장.
- **이슈**: Supabase API 요청도 캐시될 수 있음(origin 동일 시). 현재는 Supabase가 별도 origin이라 무관하나, /api/* 같은 동일 origin 동적 응답은 캐시 만료 정책 필요. 권장: Cache-Control 헤더 기반 분기.

### 4.4 iOS Safe Area
- `globals.css:21-26` — `--sat/--sab/--sal/--sar` 변수 노출 ✓
- BottomTabBar(`BottomTabBar.tsx:31`), CommentComposer(`CommentComposer.tsx:46`), FAB(`FAB.tsx:22`), Sheet(`Sheet.tsx:43`), MainLayout(`(main)/layout.tsx:18`) 모두 적용 ✓

### 4.5 iOS 입력 zoom
- TextField/TextArea base font-size 16px ✓ (TextField.tsx:44 `text-base`, TextArea.tsx:43 `text-base`, globals.css:7 `font-size: 16px`)

### 4.6 터치 타겟 ≥44px
- Button md/lg ≥44px ✓, TextField 11(=44px) ✓, BottomTab `min-h-[56px]` ✓
- AppBar back 버튼 11×11 ✓, AppBar 우상단 아바타(home page) 9×9 = 36px **FAIL** (page.tsx:38-43)
- NoticeMenu/PostMenu 메뉴 트리거 9×9 = 36px **FAIL**
- CalendarGrid 이전/다음 달 버튼 9×9 = 36px **FAIL** (CalendarGrid.tsx:62, 70)
- CalendarGrid 날짜 셀 `h-10` = 40px **FAIL**

### 4.7 종합
- 정적 분석상 PWA 인스톨 조건은 충족. Lighthouse PWA 점수 추정 90+ (manifest/SW/HTTPS 가정).
- 터치 타겟 다수 미달 — Designer §7.1 위반.

---

## 5. 접근성 검증 (정적)

### 5.1 통과 항목
- ✓ Pretendard + `font-size: 16px` 기준
- ✓ 본문 색상 16:1 명도비(Designer §7.2 토큰)
- ✓ ToastProvider `aria-live="polite"` (Toast.tsx:31)
- ✓ TextField/TextArea — `<label htmlFor>`, `aria-required`, `aria-invalid`, `aria-describedby` 모두 구현
- ✓ 비밀번호 토글 `aria-pressed` (LoginForm.tsx:64-65)
- ✓ BottomTab `aria-current="page"`, `aria-label="주 탐색"` (BottomTabBar.tsx:28, 39)
- ✓ AppBar back 버튼 `aria-label="뒤로"`
- ✓ FAB `aria-label`
- ✓ DuesMatrixRow `aria-label`로 상태와 동작 안내 (DuesMatrixRow.tsx:18)
- ✓ `prefers-reduced-motion` 처리 (globals.css:28-36)
- ✓ IME 처리 — CommentComposer(L18-19, 53-55), DuesAdminClient(L78-80), TextArea 내장(TextArea.tsx:18-19, 40-41)

### 5.2 미흡 항목

| 위치 | 이슈 | 권장 |
|------|------|------|
| `app/(auth)/signup/SignupForm.tsx:80,82` | 비밀번호 토글 `aria-label="비밀번호 표시 토글"` 고정 — `aria-pressed` 누락 | 토글 상태 반영 |
| `Sheet.tsx`, `ConfirmDialog.tsx`, `ApprovalRequestCard.tsx:86` | 포커스 트랩/복귀 없음 | B-12 참조 |
| `SegmentedControl.tsx` | `role="tablist"` 사용했으나 panel 연결 없음 | B-13 참조 |
| `CommentComposer.tsx:60` | `<textarea>` placeholder만 — `aria-label` 또는 visually hidden label 없음 | label 추가 |
| `app/(main)/me/edit/ProfileEditor.tsx:61-62` | disabled+readOnly 필드("이메일/학번")가 폼 안에 있으나 스크린리더가 어떤 라벨인지만 읽고 "변경 불가" 의도 약함 | `aria-disabled="true"` 명시 |
| `NoticeMenu/PostMenu/EventMenu` 드롭다운 | `aria-haspopup`, `aria-expanded`, `role="menu"` 없음 | ARIA 메뉴 패턴 적용 |
| `CalendarGrid` 날짜 버튼 | 일요일/토요일 색상으로만 구분 (CalendarGrid.tsx:80-82) | 텍스트 또는 아이콘 보강 |
| `Badge` 상태 — `DuesStatusBadge` 아이콘+텍스트 동시 | ✓ Designer §7.2 준수 |
| `globals.css:16-18` | `*:focus-visible` 전역 포커스 — 일관 적용 ✓ |

### 5.3 색 대비 점검 (디자인 토큰 기반)
- success(#16A34A) on success-bg(#DCFCE7) — 약 5.0:1 → AA 텍스트 OK
- warning(#D97706) on warning-bg(#FEF3C7) — 약 4.7:1 → AA OK
- danger(#DC2626) on danger-bg(#FEE2E2) — 약 5.5:1 → AA OK
- text.muted(#94A3B8) on bg(#F8FAFC) — 약 3.0:1 → **AA 일반 텍스트 미달** (보조 텍스트로만 사용 권장. 현재 placeholder/날짜 단위로만 사용되어 회색지대)

---

## 6. 한국어/UX 디테일

| 항목 | 상태 | 비고 |
|------|------|------|
| IME 조합 중 Enter submit 방지 | PASS | CommentComposer, TextArea, DuesAdminClient 검색 |
| 시간대 KST 고정 | PASS | format.ts 전 Intl 포매터가 `Asia/Seoul` |
| 날짜 표기 `YYYY.MM.DD (요일)` | PASS | formatDate. 단 정규식 의존 — B-18 |
| KRW 표기 `50,000원` | PASS | formatKRW |
| 한국어 자모 정렬 | WARN | dues_term은 라벨 알파벳/숫자 정렬 가능하지만 한글 학기명 ("2026-봄") 섞이면 깨짐 — B-06 |
| 학번 입력 검증 (숫자만) | PASS | SignupForm zod regex |
| 한글 본문 line-height ≥1.5 | PASS | `leading-relaxed`(공지 상세, 댓글 등) |

---

## 7. 수정 요청 — 담당 에이전트별 분류

### Backend 에이전트
- **B-01 (P0)**: `reject_membership` 상태 분리 (`'rejected'` enum 추가 또는 `rejected_reason` 기반 분기 정책 합의). PM 확인 후 마이그레이션.
- **B-03 (P0)**: `dues_payment.memo_public boolean` 추가 + 회원 SELECT 정책에 `memo_public=true`만 노출하는 view/RPC.
- **B-04 (P0)**: `list_dues_unpaid` 필터 정책 결정 — active만 유지 시 명세 추가, 아니면 옵션 파라미터.
- **B-05 (P0)**: `profiles` `BEFORE UPDATE` 트리거로 비-admin/officer의 `role`/`status` 변경 차단. 또는 column-level RLS.
- **B-06 (P1)**: `dues_term`에 `year int`, `term int` 컬럼 추가.
- **B-08 (P1)**: 실 Supabase 환경 셋업 후 `gen types` 자동화.
- **B-15 (P2)**: `dues_term` hard delete 차단 또는 cascade를 set null로 변경.

### Frontend 에이전트
- **B-02 (P0)**: 게시글 상세 페이지에 본인 댓글 삭제 핸들러 연결.
- **B-09 (P1)**: PM 결정에 따라 DuesEditSheet에 partial 옵션 추가 또는 Badge에서 제거.
- **B-10 (P1)**: 댓글 등록 시 낙관적 업데이트.
- **B-11 (P1)**: 게시글 본인 수정 라우트 추가 (`/board/[id]/edit`) — Designer 명세 일치 위해.
- **B-12 (P1)**: Sheet/ConfirmDialog에 focus trap 도입.
- **B-13 (P1)**: SegmentedControl을 `role="radiogroup"`으로 전환 또는 tabpanel 마크업 추가.
- 모바일 터치 타겟: AppBar 아바타·메뉴 트리거·CalendarGrid 날짜 셀을 44px 이상으로.
- **B-14 (P2)**: KST 날짜 변환 `Intl.DateTimeFormat` 기반으로 리팩토링.
- B-07 (P1) 협의: middleware의 status 조회를 JWT claim으로 이관 — Backend와 공동.

### Designer 에이전트
- 메모 공개 정책 (SCR-060 체크박스) 최종 라벨/툴팁 확정.
- 반려/정지 안내 화면(SCR 신설) 와이어 추가 — B-01 후속.
- partial 상태의 UI 표현 결정.
- 모더레이션(타인 게시글 삭제/숨김, 타인 댓글 삭제) 화면 명세 — PM이 P1로 확정하면 추가.

### PM 에이전트
- B-01: 반려 회원의 재가입 정책 결정.
- B-04: 정지/탈퇴 회원 미납 표시 정책.
- B-09: partial 상태를 P0에 포함할지.
- B-11: 게시글 수정 P0 포함 여부.

---

## 8. 권장 후속 작업 (P1 백로그 우선순위)

1. **모더레이션 UI 일괄 구현** (US-60 P1) — 임원의 타인 게시글 숨김/삭제, 타인 댓글 삭제.
2. **알림 인앱 UI** (P1) — 헤더 종 아이콘, 알림 목록 페이지, `markRead` 호출. lib/api/notifications.ts는 준비됨.
3. **회원 디렉토리** (US-51 P1) — listActiveMembers가 lib/api/members.ts에 있음.
4. **권한 관리 화면** (US-52 P1) — grant_officer/revoke_officer RPC 준비됨.
5. **CSV 내보내기** (US-33 P1) — 미납자 목록부터.
6. **웹 푸시** (US-13/45 P1) — VAPID + SW 확장.
7. **자동 생성 타입 도입** (B-08) — 가장 큰 회귀 위험 감소.

---

## 부록. 검증 못 한 항목 (런타임 필요)

- 실제 RLS 거부 응답 코드/메시지 검증
- 미들웨어가 매 요청 발생시키는 DB 조회의 실 RTT
- 모바일 디바이스(360px iPhone SE, Galaxy S8) 실 렌더
- 한국어 IME(MS-IME, Samsung 키보드) 조합 종료 직후 Enter 시 React 18 동작
- 200명 더미 데이터에서 회비 매트릭스 페이지 LCP
- 서비스 워커가 실제로 cache fallback을 반환하는 시나리오

이상 항목은 스테이징 환경 확보 후 회귀 QA 단계에서 재실행 권장.
