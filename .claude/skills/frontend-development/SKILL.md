---
name: frontend-development
description: 원우회/커뮤니티 앱의 Next.js + TypeScript + Tailwind 프론트엔드 구현. PWA 설정, Supabase 클라이언트 통합, 컴포넌트 코드 생성. "프론트엔드 구현", "Next.js 페이지 만들기", "컴포넌트 코딩", "PWA 설정", "Supabase 클라이언트 연결" 요청 시 사용. 백엔드 DB 설계나 디자인 와이어프레임 요청에는 사용하지 않음.
---

# Frontend Development Skill

Frontend Engineer 에이전트가 사용. Designer 카탈로그와 Backend API를 결합해 동작하는 Next.js 앱을 구현한다.

기본 스택: **Next.js 14+ (App Router) + TypeScript + Tailwind CSS + Supabase JS**

## 워크플로우

### 1. 프로젝트 부트스트랩 (최초 실행 시)

```bash
# package.json, tsconfig.json, tailwind.config.ts, next.config.js
# app/, components/, lib/ 디렉토리 구조 생성
```

표준 디렉토리:
```
app/
  (auth)/login/page.tsx, signup/page.tsx
  (main)/layout.tsx          # 하단 탭 네비
    page.tsx                  # 홈
    board/page.tsx, [id]/page.tsx
    events/page.tsx
    members/page.tsx
  api/                        # 권한 필요한 서버 액션만
components/
  ui/                         # 디자인 토큰 기반 원시 컴포넌트
  notice/, post/, event/      # 도메인 컴포넌트
lib/
  supabase/client.ts, server.ts
  api/notices.ts, posts.ts, events.ts
  types/database.ts           # supabase gen types
public/
  manifest.json
  icons/
```

### 2. 디자인 토큰 → Tailwind config
Designer 산출물의 토큰을 `tailwind.config.ts`로 옮김. 색·간격·타이포 모두 토큰명 그대로 사용.

### 3. Supabase 타입 동기화
```bash
npx supabase gen types typescript --project-id <id> > lib/types/database.ts
```
모든 API 함수는 이 타입을 import해 사용. 수동 타입 정의 금지(드리프트 원인).

### 4. API 통합 레이어
`lib/api/{domain}.ts` 패턴:
```ts
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database';

export type Notice = Database['public']['Tables']['notices']['Row'] & {
  author: Pick<Database['public']['Tables']['profiles']['Row'], 'name' | 'role'>;
};

export async function listNotices(limit = 20): Promise<Notice[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notices').select('...').limit(limit);
  if (error) throw error;
  return data as Notice[];
}
```

**경계면 검증:** Backend 명세를 그대로 옮기되, 첫 통합 시 실제 응답을 `console.log` 또는 테스트로 한 번은 확인. 불일치 시 어댑터 만들지 말고 Backend에 SendMessage.

### 5. 컴포넌트 구현
Designer 카탈로그 ID 순서대로:
- Server Component 우선 (목록, 상세 같은 데이터 페치)
- Client Component는 상호작용 있을 때만 (`'use client'`)
- React Query/SWR은 클라이언트 캐시 필요 시만 도입

### 6. PWA 설정
- `app/manifest.ts` 또는 `public/manifest.json` — name, icons, display: 'standalone', theme_color
- 서비스 워커: `next-pwa` 또는 직접 작성. 공지 목록 캐시(Network-First with fallback).
- iOS 메타 태그: `apple-mobile-web-app-capable`, `apple-touch-icon`

### 7. 한국어 UX 디테일
- 검색 입력: `onCompositionStart/End`로 IME 조합 중 디바운스 일시 중지
- 날짜: `Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul' })`
- 정렬: `localeCompare('ko-KR')`

### 8. 폼 검증
- React Hook Form + zod로 클라이언트 검증
- 서버 검증과 메시지 일치 (Backend 제약을 zod 스키마로 옮김)

## 출력 형식
- `_workspace/04_frontend_impl.md` — 구현 계획·진행 상황
- 실제 코드: `app/`, `components/`, `lib/`, `public/`, `tailwind.config.ts` 등

## 재실행 시
변경된 화면/컴포넌트만 수정. props 변경 시 사용처 grep으로 전수 확인.

## 모듈 완성 시
완성된 모듈을 QA에게 SendMessage로 즉시 알림(incremental QA 트리거).
