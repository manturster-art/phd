---
name: integration-qa
description: 원우회 앱의 통합 정합성·경계면 검증. API↔UI shape 비교, RLS 권한 시뮬레이션, 모바일/PWA/접근성 검증을 수행. "QA", "통합 테스트", "경계면 검증", "권한 테스트", "모바일 검증", "Lighthouse 검사" 요청 시 사용. 새 기능 구현이나 디자인 요청에는 사용하지 않음.
---

# Integration QA Skill

QA Engineer 에이전트가 사용. "존재 확인"이 아닌 **"경계면 교차 비교"**를 수행한다.

## 핵심 원칙

QA의 가장 큰 가치는 두 곳의 정의를 동시에 읽고 비교하는 데 있다:
- Backend 명세와 Frontend 코드를 동시에 읽어 shape 불일치 검출
- RLS 정책과 UI의 권한 분기를 동시에 읽어 정책 누락 검출
- Designer 와이어와 실제 렌더링을 비교해 의도 이탈 검출

## 워크플로우

### 1. 검증 매트릭스 수립
`01_pm_requirements.md`의 P0 사용자 스토리를 행으로, 검증 카테고리(기능/권한/모바일/접근성/성능)를 열로 한 표 생성.

### 2. 경계면 교차 비교

**API ↔ UI 비교 절차:**
1. `03_backend_design.md`의 API 응답 shape을 추출
2. `lib/api/*.ts`의 타입 정의 확인
3. 컴포넌트에서 실제 사용하는 필드 grep
4. 세 곳이 모두 일치하는지 매핑 표 작성

```
notices.title:
  backend (03_backend_design.md:L142): string, max 200
  lib/api/notices.ts:L23: title: string
  components/notice/NoticeCard.tsx:L12: notice.title (used)
  RESULT: ✓ 일치
```

**자주 발견되는 경계면 버그:**
- snake_case vs camelCase 혼재 (`created_at` vs `createdAt`)
- 중첩 객체 평탄화 차이 (`author.name` vs `author_name`)
- nullable 처리 누락 (Backend는 nullable인데 Frontend가 비-null 전제)
- 배열 vs 단일값 (관계 hint 누락 시 Supabase가 배열로 반환)

### 3. RLS / 권한 검증
- `supabase/migrations/*.sql`의 모든 정책 추출
- 각 정책에 대해 통과/거부 시나리오 생성
- 가능하면 SQL로 시뮬레이션 (`set role authenticated; set request.jwt.claim.sub = ...; select ...`)
- 실행 불가 환경이면 정책 코드 정적 분석 + UI의 권한 분기 코드와 대조

권한 매트릭스 검증:
| 액션 | DB 정책 존재 | UI 분기 존재 | 일치 |
|------|------------|-------------|------|
| 공지 작성 | ✓ officer만 | ✓ role !== officer면 버튼 숨김 | ✓ |
| 게시글 삭제(타인) | ✗ 정책 없음 | ✓ admin만 버튼 노출 | ✗ **DB 정책 누락** |

### 4. 모바일 / PWA 검증
- `manifest.json` 필수 필드 확인
- Lighthouse 모바일 (가능 시): Performance/Accessibility/Best Practices/PWA
- 360px 너비 렌더링: 가로 스크롤 발생 컴포넌트 검출
- 터치 타겟 크기: 버튼/링크 최소 44px

### 5. 접근성
- 색 대비: Designer 토큰 + 실제 사용 조합 확인
- 폼 라벨: `<label for=>` 또는 `aria-label`
- 동적 알림: `aria-live`
- 키보드: 탭 순서, 포커스 표시

### 6. 리포트 작성
`_workspace/05_qa_report.md`에 다음 작성:
- 검증 매트릭스 (PASS/FAIL/SKIP + 사유)
- 경계면 버그 목록 (파일:라인 인용 필수)
- 권한 회로 결함
- 모바일/PWA 점수
- 접근성 위반 + 권장 수정

### 7. 수정 라우팅
버그를 발견 즉시 담당 에이전트에게 SendMessage:
- API shape 불일치 → Backend (서버 변경이 옳을 때) 또는 Frontend (클라이언트 변경이 옳을 때)
- RLS 정책 누락 → Backend
- 디자인 의도 이탈 → Designer + Frontend

## 점진적 실행 (Incremental QA)
Frontend가 모듈 완성을 알릴 때마다 즉시 해당 모듈만 검증. 전체 완성을 기다리지 않는다. 이유: 경계면 버그는 빠른 피드백 루프에서 가장 적은 비용으로 수정 가능.

## 도구 미비 시 대응
- Lighthouse 실행 불가 → 수동 체크리스트로 대체, 리포트에 "정적 분석" 표시
- 실제 인증 환경 부재 → SQL 정책을 직접 읽고 케이스별 통과 여부를 논리적으로 추론
