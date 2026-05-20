# 04. Frontend 구현 계획·진행 상황

> 작성자: Frontend Engineer 에이전트
> 작성일: 2026-05-20
> 기반: PM v0.2 · Designer v0.1 · Backend v0.1
> 산출물: Next.js 14 + TypeScript + Tailwind + Supabase

## 변경 로그
| 날짜 | 버전 | 변경 |
|------|------|------|
| 2026-05-20 | v0.1 | P0 MVP 전 화면 1차 구현 완료. |

---

## 1. 프로젝트 구조

```
phd/
├─ app/
│  ├─ (auth)/                       비공개 인증 영역
│  │  ├─ login/page.tsx + LoginForm.tsx        SCR-001
│  │  ├─ signup/page.tsx + SignupForm.tsx      SCR-002
│  │  ├─ signup/pending/page.tsx + LogoutButton SCR-003
│  │  └─ reset/page.tsx                         SCR-073 (P1, placeholder)
│  ├─ (main)/                       인증 후 메인
│  │  ├─ layout.tsx                 세션·status 가드 + BottomTabBar
│  │  ├─ page.tsx                   SCR-010 홈 대시보드
│  │  ├─ notices/                   SCR-020/021/022
│  │  ├─ board/                     SCR-030/031/032
│  │  ├─ calendar/                  SCR-040/041/042
│  │  ├─ dues/                      SCR-050/060/061/062/063
│  │  ├─ me/                        SCR-070/071/072
│  │  └─ admin/approvals/           SCR-080
│  ├─ error.tsx                     SCR-ERR-NET (전역 에러)
│  ├─ not-found.tsx                 SCR-ERR-404
│  ├─ layout.tsx                    RootLayout + ToastProvider
│  ├─ manifest.ts                   PWA manifest
│  └─ globals.css                   Tailwind base + iOS safe-area
├─ components/
│  ├─ ui/                C-100 외 기본 UI 13종
│  ├─ layout/            AppBar / BottomTabBar / FAB / RegisterSW
│  ├─ notice/            NoticeCard, NoticeListSection
│  ├─ post/              PostListItem, CommentItem, CommentComposer
│  ├─ event/             EventListItem, CalendarGrid
│  ├─ dues/              DuesStatusBadge/HistoryCard/ItemCard/MatrixRow/MatrixTable/EditSheet/UnpaidMemberItem
│  └─ admin/             ApprovalRequestCard
├─ lib/
│  ├─ supabase/          client / server / middleware
│  ├─ api/               notices / posts / events / dues / members / notifications
│  ├─ types/database.ts  수동 작성 Database 타입 (마이그레이션 기반)
│  └─ utils/             format(KST·KRW) / cn / auth(getCurrentProfile, isOfficer, isAdmin)
├─ middleware.ts         updateSession + status 가드
├─ public/sw.js          기본 서비스 워커 (Network-first)
└─ public/icons/         PWA 아이콘 placeholder
```

---

## 2. 라우트 ↔ 화면 매핑

| 라우트 | 화면 ID | 권한 |
|--------|---------|------|
| `/login` | SCR-001 | public |
| `/signup` | SCR-002 | public |
| `/signup/pending` | SCR-003 | pending only |
| `/reset` | SCR-073 | public (P1) |
| `/` | SCR-010 홈 | member+ |
| `/notices` | SCR-020 | member+ |
| `/notices/[id]` | SCR-021 | member+ |
| `/notices/new` | SCR-022 (작성) | officer+ |
| `/notices/[id]/edit` | SCR-022 (수정) | officer+ |
| `/board` | SCR-030 | member+ |
| `/board/[id]` | SCR-031 | member+ |
| `/board/new` | SCR-032 | member+ |
| `/calendar` | SCR-040 | member+ |
| `/calendar/[id]` | SCR-041 | member+ |
| `/calendar/new` | SCR-042 | officer+ |
| `/dues` | SCR-050 | member+ |
| `/dues/admin` | SCR-060 | officer+ |
| `/dues/admin/items` | SCR-061 | officer+ |
| `/dues/admin/items/new` | SCR-062 (생성) | officer+ |
| `/dues/admin/items/[id]` | SCR-062 (수정) | officer+ |
| `/dues/admin/items/[id]/unpaid` | SCR-063 | officer+ |
| `/me` | SCR-070 | member+ |
| `/me/edit` | SCR-071 | member+ |
| `/me/password` | SCR-072 | member+ |
| `/admin/approvals` | SCR-080 | officer+ |

---

## 3. 컴포넌트 구현 상태 (Designer 카탈로그 ID 기준)

### C-1xx 기본 UI
| ID | 컴포넌트 | 상태 | 위치 |
|----|----------|------|------|
| C-100 | AppBar | ✅ | components/layout/AppBar.tsx |
| C-101 | TextField | ✅ | components/ui/TextField.tsx |
| C-102 | TextArea | ✅ | components/ui/TextArea.tsx |
| C-110 | PrimaryButton | ✅ | components/ui/Button.tsx (variant=primary) |
| C-111 | SecondaryButton | ✅ | Button.tsx (variant=secondary/ghost) |
| C-112 | DangerButton | ✅ | Button.tsx (variant=danger) |
| C-120 | TextLink | ✅ | (Tailwind 직접 사용; 별도 컴포넌트 미생성) |
| C-130 | MarkdownEditor | ⚠️ MVP는 TextArea 대체 (마크다운 본문 텍스트 저장만) |
| C-140 | SegmentedControl | ✅ | components/ui/SegmentedControl.tsx |
| C-141 | ModeToggle | ✅ | SCR-050 헤더에 인라인 Link로 구현 (임원 모드) |
| C-150 | BottomTabBar | ✅ | components/layout/BottomTabBar.tsx |
| C-160 | FAB | ✅ | components/layout/FAB.tsx |
| C-170 | BottomSheet | ✅ | components/ui/Sheet.tsx |
| C-171 | ConfirmDialog | ✅ | components/ui/ConfirmDialog.tsx |
| C-180 | Toast | ✅ | components/ui/Toast.tsx (Provider 패턴) |
| C-190 | Skeleton | ✅ | components/ui/Skeleton.tsx |

### C-2xx 정보 표시
| ID | 컴포넌트 | 상태 | 비고 |
|----|----------|------|------|
| C-201 | GreetingHeader | ✅ | 홈 페이지에 인라인 (별도 추출 안 함) |
| C-202 | RoleBadge | ✅ | Badge에 tone 매핑 (me/page.tsx에서 사용) |
| C-210 | SectionHeader | ✅ | components/ui/SectionHeader.tsx |
| C-220 | StatusPill | ✅ | components/ui/Badge.tsx |
| C-230 | InfoBanner | ✅ | components/ui/InfoBanner.tsx |
| C-240 | FilterDropdown | ✅ | DuesAdminClient에서 native `<select>` 사용 |
| C-241 | StatSummary | ✅ | DuesAdminClient의 통계 박스 |
| C-250 | EmptyState | ✅ | components/ui/EmptyState.tsx |
| C-251 | ErrorState | ✅ | app/error.tsx + not-found.tsx |

### C-3xx 도메인 카드
| ID | 컴포넌트 | 상태 |
|----|----------|------|
| C-301 | NoticeCard | ✅ |
| C-310 | EventListItem | ✅ |
| C-311 | PostListItem | ✅ |
| C-320 | CommentItem | ✅ |
| C-321 | CommentComposer | ✅ (IME 안전) |
| C-330 | CalendarGrid | ✅ |
| C-331 | DateChip | ✅ (CalendarGrid 내부 버튼) |

### C-4xx 회비 도메인
| ID | 컴포넌트 | 상태 |
|----|----------|------|
| C-401 | DuesStatusBadge | ✅ |
| C-410 | DuesHistoryCard | ✅ |
| C-420 | DuesMatrixRow | ✅ (모바일) |
| C-421 | DuesMatrixTable | ✅ (md+ 데스크톱) |
| C-430 | DuesEditSheet | ✅ |
| C-440 | UnpaidMemberItem | ✅ (전화/복사 인터랙션) |
| C-450 | DuesItemCard | ✅ |

### C-5xx 관리/모더레이션
| ID | 컴포넌트 | 상태 |
|----|----------|------|
| C-501 | ApprovalRequestCard | ✅ |
| C-502 | RejectReasonSheet | ✅ (ApprovalRequestCard 내부 모달로 통합) |

---

## 4. API 통합 레이어

`lib/api/{domain}.ts` 패턴. 모든 함수는 첫 인자로 `SupabaseClient<Database>`를 받아 RSC와 Client Component 양쪽에서 재사용 가능.

| 파일 | 주요 함수 | 사용 화면 |
|------|----------|-----------|
| notices.ts | listNotices · getNotice · createNotice · updateNotice · deleteNotice | SCR-010/020/021/022 |
| posts.ts | listPosts · getPost · createPost · deletePost · listComments · createComment · deleteComment | SCR-030/031/032 |
| events.ts | listUpcomingEvents · listEventsInRange · getEvent · createEvent · deleteEvent | SCR-010/040/041/042 |
| dues.ts | listDuesTerms · getDuesTerm · createDuesTerm · updateDuesTerm · deleteDuesTerm · listMyDues · listDuesMatrix · listUnpaid · updateDuesPayment | SCR-010/050/060~063 |
| members.ts | listPendingMembers · listActiveMembers · approveMember · rejectMember · updateMyProfile | SCR-070/071/080 |
| notifications.ts | listNotifications · countUnread · markRead · markAllRead | (P1 화면 대기) |

Backend의 RPC 매핑:
- `approve_membership` → `members.approveMember`
- `reject_membership` → `members.rejectMember`
- `list_dues_unpaid` → `dues.listUnpaid`
- `mark_all_notifications_read` → `notifications.markAllRead`

---

## 5. 상태 관리 전략

- **Server Component 우선**: 목록·상세 페이지는 RSC에서 `createClient()` (server) 호출하여 직접 페치.
- **Client Component 한정**: 폼·낙관적 업데이트·시트 등 상호작용에만 `'use client'` + `createClient()` (browser).
- **React Query 도입 보류**: P0 페이지가 단순해서 `router.refresh()`로 충분. P1에서 알림 unread count, 댓글 실시간 등 캐시 수요 발생 시 도입 권장.

## 6. PWA 설정

- `app/manifest.ts` — Next.js metadata API로 manifest.webmanifest 자동 생성
- `public/sw.js` — Network-first + cache fallback 기본 SW
- `components/layout/RegisterSW.tsx` — production 빌드에서만 등록
- iOS 메타: `apple-mobile-web-app-capable`, `apple-touch-icon` 루트 레이아웃에 포함
- safe-area: globals.css에 `--sat/sab/sal/sar` 변수 노출, BottomTabBar/CommentComposer/FAB가 활용
- 아이콘: `public/icons/` 디렉토리에 placeholder만 두고 배포 전 PNG 교체 필요

## 7. 한국어 UX 디테일

- `lib/utils/format.ts`의 모든 포매터가 `Asia/Seoul` 고정
- 댓글/검색 입력에 `onCompositionStart/End` 처리 — IME 조합 중 Enter submit 차단
- TextArea/TextField는 16px font-size 유지하여 iOS Safari zoom 회피
- 회비 매트릭스: 모바일은 학기 1개 선택 + 회원 리스트(DuesMatrixRow), 데스크톱(md+)은 가로 테이블(DuesMatrixTable)

---

## 8. Backend 명세 사용 중 발견한 메모

QA·Backend에게 전달:

1. **`dues_payment` 단/복수 일치**: Backend 명세 §부록 B.2에서 Designer 시퀀스가 `dues_payments`(복수)로 표기했다고 지적함. Frontend는 마이그레이션 SQL과 일치하게 모두 단수(`dues_payment`)로 통일.
2. **`dues_payment.memo_public` 필드 미존재**: Designer SCR-060 DuesEditSheet에 "회원에게 메모 공개" 체크박스가 명세되었으나 마이그레이션엔 `memo` 단일 컬럼만 있음. **현재 UI에서는 공개 토글을 잠시 제외**하고 모든 메모는 임원만 보는 형태로 구현. Backend에 컬럼 추가 또는 메모 공개 정책 확정 필요.
3. **`profiles.status='suspended'` = 반려 회원**: `reject_membership` RPC가 status를 `suspended`로 설정하는데, 미들웨어/레이아웃에서 suspended를 "정지된 회원"으로 취급해 `/login`으로 보냄. 반려와 정지가 같은 상태값을 공유하므로 `rejected_reason` 유무로 구분해야 하는 UX 정책 합의 필요.
4. **`dues_term` 정렬 키**: Designer 부록에서 `year:int + term:int(1|2)` 추가를 권장했으나 마이그레이션에는 `label text` UNIQUE만 있음. 현재 정렬은 `created_at desc`로 우회. 학기 라벨 자체로 정렬하면 "2025-2학기"가 "2026-1학기"보다 앞에 와서 자연스럽지만, "2024-가을" 같은 자유 라벨이 섞이면 깨짐.
5. **`comment_count` 트리거**: posts.comment_count는 댓글 insert/delete/soft-delete에 동기화됨. Frontend에서 댓글 등록 직후 `router.refresh()`로 카운트 재취득 — 동작 확인 필요.
6. **`partial` 상태 노출 안 함**: status enum에 있으나 Designer가 P0에선 3종만 노출하기로 합의. DuesStatusBadge는 4종 모두 표시 가능하지만 DuesEditSheet의 상태 버튼은 paid/unpaid/exempt 3종만 노출.
7. **`list_dues_unpaid` RPC가 status='active' 한정**: 좋은 동작이지만 탈퇴/정지 회원의 미납 기록은 보이지 않음. 운영 시 혼동 가능성. PM 정책 확인 필요.
8. **`profiles.role` 직접 update 차단 안 됨**: Backend가 §4.3에서 경고했듯 클라이언트가 role 컬럼 update를 시도할 수 있음. 현재 Frontend에는 그런 경로가 없으나 RLS 컬럼 정책 또는 SECURITY DEFINER RPC만 노출하는 방향 권장.

---

## 9. 빌드 검증

- `pnpm install` ✅ (10s)
- `pnpm typecheck` (`tsc --noEmit`) ✅ — 0 errors
- `pnpm build` ✅ — 23개 라우트 컴파일 성공 (5개 정적, 18개 동적)

### 빌드 중 발견한 타입 어댑팅
- supabase-js v2.106의 `SupabaseClient`가 5-제네릭으로 확장됨. 수동 작성 `Database` 타입의 `Tables[*]['Insert'/'Update']`를 PostgrestQueryBuilder가 추론 못 해 `never`로 캐스팅하는 문제 발생.
- **임시 우회**: `lib/api/*.ts`의 모든 `.insert/.update/.rpc` 호출에 `(supabase.from(...) as any)` / `(supabase as any).rpc(...)` 어댑터 적용. `.select()` 경로는 정상 타입 유지.
- **권장 후속 조치**: 실제 Supabase 프로젝트가 생성되면 `npx supabase gen types typescript --project-id <id> > lib/types/database.ts`로 공식 자동 생성 타입으로 교체. 자동 타입은 `__InternalSupabase` 슬롯 포함하여 supabase-js와 100% 호환되므로 모든 `as any` 캐스트 제거 가능.

## 10. QA 우선 검증 권장 모듈 (Top 3)

1. **회비 관리 (SCR-060/061/062/063)** — 가장 복잡한 도메인. 권한 분기, RPC 호출, BottomSheet 상태, 모바일/데스크톱 두 가지 매트릭스 뷰. 데이터 양이 늘었을 때 정렬/필터/검색 IME 동작 함께 검증 필요.
2. **인증/온보딩 흐름 (SCR-001/002/003 + middleware)** — pending 상태 라우팅 가드가 핵심. 새 가입자가 첫 로그인 시 /signup/pending으로 강제 이동, 승인 후 다음 로그인에서 / 로 진입하는지. middleware의 profiles 조회가 매 요청 발생 — 캐시·성능 영향.
3. **댓글 등록 + 게시글 카운트 동기화 (SCR-031)** — Backend 트리거(`sync_post_comment_count`)와 Frontend `router.refresh()` 타이밍. 낙관적 업데이트 미적용 상태이므로 응답 지연 시 UX 어색함 가능. IME 조합 중 Enter 입력 처리도 함께 확인.

---

## 11. v0.2 변경 (Backend v0.2 동기화 + QA P0 대응)

> 작성일: 2026-05-20
> 기반: `_workspace/05_qa_report.md` (P0 이슈) + `_workspace/03_backend_design.md` v0.2 + 마이그레이션 `20260520000010~14`
> 결과: `pnpm typecheck` 0 errors / `pnpm build` 성공 (23개 라우트).

### 11.1 변경 로그
| 날짜 | 버전 | 변경 |
|------|------|------|
| 2026-05-20 | v0.2 | Backend v0.2 동기화 (rejected enum, dues_payment_member_view, memo_public, list_dues_unpaid v2) + QA P0 B-02 본인 댓글 삭제 UI 연결 |

### 11.2 수정/추가 파일 매트릭스

| 이슈 | 파일 | 변경 요약 |
|------|------|----------|
| B-01 | `lib/types/database.ts` | `ProfileStatus`에 `'rejected'` 추가. `profiles` Row/Insert/Update에 `rejection_reason: string \| null` 추가. |
| B-01 | `lib/supabase/middleware.ts` | `status === 'rejected'` 분기를 별도로 처리 — 기존 suspended/withdrawn 와 함께 `/login?reason=<status>` 로 리다이렉트하되 reason 값을 그대로 전달. |
| B-01 | `app/(auth)/login/page.tsx` | `reason`별 라벨 분기 (`rejected`/`suspended`/`withdrawn`). `reason=rejected` 인 경우 서버 컴포넌트에서 본인 `profiles.rejection_reason` (rejected_reason 백업 fallback)을 조회해 "사유: …" 안내 + 임원 연락 안내 표시. |
| B-02 | `components/post/CommentList.tsx` (신규) | 본인 댓글 삭제 클라이언트 래퍼. `ConfirmDialog` + `deleteComment` + `router.refresh()` 처리. 본인 댓글에만 `onDelete` 핸들러 전달. |
| B-02 | `app/(main)/board/[id]/page.tsx` | 댓글 렌더링을 `CommentList`로 위임. 빈 상태/Card 처리도 컴포넌트 내부로 이동. |
| B-03 | `lib/types/database.ts` | `dues_payment` Row/Insert/Update에 `memo_public: boolean` 추가. `Views.dues_payment_member_view` 신규 정의 (memo는 마스킹 가능하므로 nullable). |
| B-03 | `lib/api/dues.ts` | `MyDuesRow.memo_public` 추가. `listMyDues`가 `dues_payment_member_view` 사용 (memo 마스킹 자동). `DuesMatrixRow.memo_public` 추가. `UpdateDuesPaymentInput`에 `memo_public?: boolean` 추가. `updateDuesPayment` 호출자가 미전송 시 기존값 유지. |
| B-03 | `components/dues/DuesEditSheet.tsx` | "회원에게 메모 공개" 체크박스 추가. 메모가 비어 있으면 비활성화. 저장 시 `memo_public`을 페이로드에 포함. |
| B-03 | `components/dues/DuesHistoryCard.tsx` | (변경 없음) — 이미 `{row.memo && ...}` 로 null 가드. view가 비공개 메모를 NULL로 마스킹하므로 자동으로 영역이 숨겨짐. |
| B-04 | `lib/types/database.ts` | `Functions.list_dues_unpaid`의 Args에 `p_include_inactive?: boolean` 추가. Returns에 `member_status: ProfileStatus`, `memo_public: boolean` 추가. |
| B-04 | `lib/api/dues.ts` | `UnpaidMember.member_status` / `.memo_public` 추가. `listUnpaid(termId, includeInactive=true)` 시그니처 변경 — RPC에 `p_include_inactive` 전달. |
| B-04 | `app/(main)/dues/admin/items/[id]/unpaid/page.tsx` | `partition()`으로 `member_status==='active'`/그 외로 분리해 "활동 회원" / "비활동 회원" 섹션 렌더. 비활동 회원에는 상태 라벨(반려/정지/탈퇴/대기) 배지 표시. 카운트 요약에도 (활동 N명, 비활동 N명) 추가. |
| B-04 | `components/dues/UnpaidMemberItem.tsx` | `badge?: string` prop 추가 — 비활동 섹션에서 상태 표시. |
| B-05 | `components/admin/ApprovalRequestCard.tsx` | 변경 없음 — 이미 `approve_membership` / `reject_membership` RPC 호출. 직접 update 경로 부재 확인. |
| B-05 | `lib/api/members.ts` | 변경 없음 — `approveMember` / `rejectMember`가 RPC 사용. `updateMyProfile`은 `name/lab/phone`만 update (role/status 제외 확인). |
| B-05 | `app/(main)/me/edit/ProfileEditor.tsx` | 변경 없음 — 폼 필드에 role/status 없음. 트리거(`guard_profiles_secure_update`)가 추가 안전망. |

### 11.3 비고

- **B-05 직접 update 경로 부재**: 정적 grep 결과 `lib/api/*.ts`와 컴포넌트 어디에도 `profiles`의 `role`/`status` 직접 update 호출 없음. Backend 트리거가 다층 방어로 차단하므로 추가 코드 변경 없음. ProfileEditor 폼 필드는 `name/lab/phone`만 보유.
- **`partial` 상태 (B-09)**: P1 — 이번 변경에 포함하지 않음. v0.2는 P0 이슈만 처리.
- **focus trap / 게시글 수정 라우트 / 모바일 터치 타겟 (B-11~B-13, 4.6)**: P1 — 차후 스프린트.
- **타입 자동 생성 (B-08)**: 실 Supabase 프로젝트 셋업 후 별도 작업.

### 11.4 검증

```
pnpm typecheck   →  0 errors
pnpm build       →  ✓ 23개 라우트 컴파일 성공
                    (정적 5, 동적 18)
```

- 라우트 그래프 변화 없음 (`/dues/admin/items/[id]/unpaid` 그대로).
- Middleware bundle size 그대로 (82.1kB).
- `view`를 쓰는 `listMyDues`는 `as any` 캐스트 1회 추가 (database 타입의 View 추론이 supabase-js v2.106에서 부족). B-08 해결 시 함께 정리.

### 11.5 남은 P0 미해결 없음

QA가 P0로 분류한 B-01/B-02/B-03/B-04/B-05 5건 모두 Backend(v0.2 마이그레이션) + Frontend(이번 변경)로 종결.

---

## 12. 데모 모드 (`/demo/*`) — 2026-05-20 추가

### 12.1 목적
Supabase 미연결 환경에서도 모든 핵심 화면을 브라우저로 시연할 수 있도록 `/demo` 라우트 트리를 추가. 로그인/세션·DB·인증을 우회하고 정적 mock 데이터로 컴포넌트만 렌더한다.

### 12.2 라우트 (13개)
- `/demo` — 데모 진입 카드 그리드 (SCR ID + 역할 배지)
- `/demo/login` (SCR-001) · `/demo/signup` (SCR-002) · `/demo/pending` (SCR-003)
- `/demo/home` (SCR-010)
- `/demo/notices` (SCR-020) · `/demo/notices/sample` (SCR-021)
- `/demo/board` (SCR-030, 탭 인터랙티브) · `/demo/board/sample` (SCR-031)
- `/demo/calendar` (SCR-040, 리스트/캘린더 토글)
- `/demo/dues-member` (SCR-050) · `/demo/dues-admin` (SCR-060, 임원 권한 배지)
- `/demo/approvals` (SCR-080, 임원 권한 배지)

### 12.3 구조
- `middleware.ts` 상단에 `/demo` 경로 통과 가드 추가 (Supabase 세션 미검사).
- `app/demo/layout.tsx` — 상단 노란색 데모 배너, 좌측(lg+) 사이드바, 하단 5탭(`DemoBottomTabBar`).
- `components/layout/DemoBottomTabBar.tsx` / `DemoSidebar.tsx` — 모든 링크가 `/demo/*` 하위.
- `components/demo/*` — 기존 컴포넌트의 데모 변형 (NoticeCard/PostListItem 은 `/demo/...` 로 링크, EventListItem 은 alert 노출, CommentComposer 는 alert 만).
- `lib/demo/mockData.ts` — 한국어 mock 데이터(공지 5, 게시글 5, 댓글 4, 일정 4, 회비 학기 3 + 회원 5명 매트릭스, 가입 대기 3). 기준 시각 2026-05-20 KST.

### 12.4 인터랙션 제약
- 로그인/가입 폼: submit 시 alert 후 가입 화면에서는 `/demo/pending` 으로 navigate, 로그인은 그대로 머묾.
- 게시글/일정 항목 클릭: 상세 페이지가 SCR-031 / SCR-021 sample 한 건뿐이므로 일정 항목은 alert 로 대체, 게시글/공지 카드는 sample 페이지로 이동.
- 회비 매트릭스 셀 클릭: 상태 변경 시트 대신 alert (시트의 디자인은 실 라우트에서 확인).
- 가입 승인/반려: alert 안내만.

### 12.5 검증
```
pnpm typecheck   →  0 errors
pnpm build       →  ✓ 41개 라우트 (기존 28개 + 데모 13개), 데모는 모두 ○(Static)
```
