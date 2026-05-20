# 대학원 원우회 앱 — Project Memory

## 하네스: 대학원 원우회 커뮤니티 앱

**목표:** 대학원 원우회의 공지·게시판·일정·회비·회원관리를 모바일 우선 PWA로 제공하는 앱을 5인 에이전트 팀(PM/Designer/Backend/Frontend/QA)으로 개발한다.

**트리거:** 원우회 앱과 관련된 모든 작업 요청 시 `graduate-assoc-orchestrator` 스킬을 사용하라. 신규 빌드/기능 추가/부분 재실행/QA 모두 이 오케스트레이터가 처리한다. 단순 질문(예: "Next.js App Router가 뭐야?")은 직접 응답 가능.

**기본 기술 스택 (PM이 사용자와 최종 합의):**
- Next.js 14+ (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth + RLS + Storage)
- PWA (manifest + 서비스 워커)

**산출물 위치:**
- `_workspace/` — 단계별 설계 문서 (감사 추적용 보존)
- `supabase/migrations/` — DB 마이그레이션
- `app/`, `components/`, `lib/` — 프론트엔드 코드

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-05-20 | 초기 구성 | 전체 (agents 5 + skills 6) | 신규 프로젝트 시작 |
