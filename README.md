# 원우회 PWA (대학원 원우회 커뮤니티)

Next.js 14 App Router + TypeScript + Tailwind + Supabase 기반 모바일 PWA.

## 빠른 시작

```bash
pnpm install            # 또는 npm install / yarn install
cp .env.example .env.local
# .env.local에 Supabase 프로젝트 URL/anon key 입력
pnpm dev                # http://localhost:3000
```

## 환경 변수

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public anon key

## Supabase 준비

`supabase/migrations/` 내 SQL을 순서대로 적용하세요.

```bash
supabase db reset       # 초기화 + seed
supabase db push        # 신규 마이그레이션 반영
```

타입은 `lib/types/database.ts`에 수동 정의되어 있습니다. 실제 운영 환경에서는 다음으로 자동 동기화 권장:

```bash
npx supabase gen types typescript --project-id <id> > lib/types/database.ts
```

## 디렉토리 구조

```
app/
  (auth)/           로그인·가입·승인 대기·비번 재설정
  (main)/           인증 후 메인 (하단 탭 5개)
    notices/        공지
    board/          게시판
    calendar/       일정
    dues/           회비 (회원 + 임원)
    me/             내 프로필
    admin/          임원 전용 (가입 승인)
components/
  ui/               기본 UI (C-1xx, C-2xx)
  layout/           AppBar, BottomTabBar, FAB
  notice/, post/, event/, dues/, admin/
                   도메인 컴포넌트 (C-3xx ~ C-5xx)
lib/
  supabase/         createClient (browser/server) + middleware 헬퍼
  api/              도메인별 fetch 함수
  types/database.ts Supabase 스키마 타입
  utils/            format, cn, auth 가드
public/
  manifest.webmanifest (Next.js metadata API가 생성)
  sw.js             기본 서비스 워커
  icons/            PWA 아이콘 (배포 전 채워야 함)
middleware.ts       세션 갱신 + status 가드
```

## 화면 ↔ 라우트 매핑

`_workspace/04_frontend_impl.md` 참조.

## PWA 아이콘

`public/icons/` 디렉토리에 다음 PNG를 배치하세요:
- `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`

## 스크립트

- `pnpm dev` — 개발 서버
- `pnpm build` — 프로덕션 빌드
- `pnpm start` — 빌드 결과 실행
- `pnpm typecheck` — 타입 검사
- `pnpm lint` — ESLint
