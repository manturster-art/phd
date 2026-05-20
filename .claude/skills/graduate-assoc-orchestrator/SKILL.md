---
name: graduate-assoc-orchestrator
description: 대학원 원우회 커뮤니티 앱(공지·게시판·일정·회비·회원관리) 개발을 PM/Designer/Backend/Frontend/QA 5인 에이전트 팀으로 조율한다. "원우회 앱 만들어줘", "원우회 사이트 개발", "공지/게시판/일정 기능 추가", "원우회 앱 다시 만들어", "원우회 프로젝트 재실행", "이전 결과 업데이트", "[모듈]만 다시 만들어줘", "MVP 빌드" 같은 원우회 앱 관련 모든 요청에 사용. 단순 코딩 질문이나 다른 도메인 프로젝트에는 사용하지 않음.
---

# Graduate Association App — Orchestrator

대학원 원우회 커뮤니티 앱 개발 전체 워크플로우를 조율한다. **실행 모드: 에이전트 팀** (5명).

## 팀 구성

| 에이전트 | 빌트인 타입 | 역할 |
|---------|----------|------|
| pm | general-purpose | 요구사항·사용자 스토리 |
| designer | general-purpose | UX/UI, 컴포넌트 카탈로그 |
| backend-engineer | general-purpose | DB·API·RLS·인증 |
| frontend-engineer | general-purpose | Next.js 구현, PWA |
| qa-engineer | general-purpose | 통합/경계면 검증 |

**모든 Agent 호출에 `model: "opus"` 명시.**

## Phase 0: 컨텍스트 확인 (필수 선행)

워크플로우 시작 시 다음을 확인하여 실행 모드 결정:

1. `_workspace/` 디렉토리 존재 여부 확인 (`ls _workspace/ 2>/dev/null`)
2. 사용자 요청 분석:
   - **초기 실행**: `_workspace/` 없음 → Phase 1부터 전체 실행
   - **부분 재실행**: `_workspace/` 있음 + 사용자가 특정 단계 수정 요청 (예: "디자인만 다시", "권한 정책 보강") → 해당 에이전트만 재호출, 다른 산출물은 그대로
   - **전체 재실행**: `_workspace/` 있음 + 새로운 입력/큰 변경 → 기존을 `_workspace_prev/`로 이동 후 Phase 1부터
   - **이어가기**: `_workspace/` 일부만 있음 → 누락된 Phase부터 진행

3. 사용자에게 감지된 모드를 한 문장으로 보고하고 진행

## Phase 1: 요구사항 정의 (단독, PM)

**실행 모드:** 단일 에이전트 (팀 구성 전)

```
Agent(
  subagent_type="general-purpose",
  description="PM 요구사항 정의",
  model="opus",
  prompt="""
    당신은 .claude/agents/pm.md에 정의된 PM이다.
    .claude/skills/requirement-analysis/SKILL.md를 따라 요구사항을 정의하라.
    사용자 요청: {user_request}
    출력: _workspace/01_pm_requirements.md
  """
)
```

산출물이 나오면 사용자에게 핵심 가정(가입 방식, 회원 단위, 권한 모델)을 짧게 요약 보고하고 진행 동의 확인.

## Phase 2: 설계 (병렬 팬아웃, Designer + Backend)

**실행 모드:** 에이전트 팀 (2인)

TeamCreate으로 `design-team` 구성:
- members: designer, backend-engineer
- 공유 컨텍스트: `_workspace/01_pm_requirements.md`

TaskCreate로 두 작업 동시 부여 (의존성 없음):
- T1: designer → `_workspace/02_designer_uiux.md` 생성
- T2: backend-engineer → `_workspace/03_backend_design.md` + `supabase/migrations/*.sql` 생성

팀원 간 SendMessage 허용 (필드 협의 등). 두 작업 모두 완료 시 팀 해체.

## Phase 3: 구현 (Frontend, Designer/Backend 협업)

**실행 모드:** 에이전트 팀 (3인)

TeamCreate으로 `build-team` 구성:
- members: frontend-engineer (리더), designer, backend-engineer
- designer/backend는 질문 응답 역할

TaskCreate:
- T3: frontend-engineer → 프로젝트 부트스트랩 + 컴포넌트/페이지 구현 + `_workspace/04_frontend_impl.md`
- 의존성: T1, T2 완료

Frontend가 모듈 단위로 완성 시 QA 에이전트에게 SendMessage(다음 Phase로 인계).

## Phase 4: 검증 (QA, 점진적)

**실행 모드:** 에이전트 팀 확장 (QA 합류)

기존 `build-team`에 qa-engineer 추가 (TeamUpdate 또는 재구성). QA는:
- Frontend의 모듈 완성 알림마다 즉시 해당 모듈 검증
- 발견 즉시 담당 에이전트에 SendMessage
- 모든 모듈 검증 완료 시 `_workspace/05_qa_report.md` 작성

QA 리포트가 FAIL을 포함하면 Phase 3-4 루프 반복 (최대 3회). 이후에도 FAIL이면 사용자에게 결정 요청.

## Phase 5: 종합 및 인계

오케스트레이터가 직접:
1. 5개 산출물 요약을 사용자에게 보고
2. `_workspace/` → 최종 산출물 위치 매핑
3. 다음 단계 제안 (배포, 추가 기능, 사용자 테스트 등)
4. 피드백 수집 ("개선할 부분 있나요?")

## 데이터 전달 프로토콜

| 산출물 | 위치 | 생산자 | 소비자 |
|--------|------|--------|--------|
| 요구사항 | `_workspace/01_pm_requirements.md` | pm | 전원 |
| UI 설계 | `_workspace/02_designer_uiux.md` | designer | frontend, qa |
| 백엔드 설계 | `_workspace/03_backend_design.md` | backend | frontend, qa |
| 마이그레이션 | `supabase/migrations/*.sql` | backend | frontend, qa |
| 구현 코드 | `app/`, `components/`, `lib/` | frontend | qa |
| QA 리포트 | `_workspace/05_qa_report.md` | qa | 전원 |

파일명 컨벤션: `{phase번호}_{에이전트}_{종류}.md`. `_workspace/`는 사후 감사용으로 보존.

## 에러 핸들링

| 상황 | 대응 |
|------|------|
| 에이전트 1차 실패 | 1회 재시도 |
| 재시도도 실패 | 해당 산출물 없이 다음 Phase 진행, 최종 리포트에 누락 명시 |
| 산출물 간 충돌 | 양쪽 출처 병기, 결정은 PM 또는 사용자에게 위임 |
| QA FAIL 3회 반복 | 사용자에게 결정 요청 (계속 시도 / 우회 / 범위 축소) |

## 팀 크기 가이드 준수
- 5명 팀이지만 Phase별로 2~3명만 활성화하여 조율 오버헤드 관리
- 한 Phase에 5명 전부 활성화 금지

## 테스트 시나리오

**시나리오 1 (정상 흐름):**
사용자 입력: "원우회 앱 만들어줘. 공지/게시판/일정/회비 기능 필요"
기대: Phase 0(초기 감지) → Phase 1~5 순차 실행 → 5개 산출물 + 동작하는 Next.js 코드 + QA 리포트

**시나리오 2 (부분 재실행):**
사용자 입력: (Phase 5 이후) "디자인 토큰을 좀 더 부드러운 톤으로"
기대: Phase 0이 designer만 재호출로 판단 → designer가 02_designer_uiux.md 수정 → frontend가 토큰만 재적용 → qa가 모바일 재검증

**시나리오 3 (에러):**
backend-engineer가 RLS 정책 생성 실패 → 1회 재시도 → 성공. 또는 재실패 시 정책 없이 마이그레이션 생성하고 QA 리포트에 "RLS 미적용 — 프로덕션 배포 전 보강 필수" 명시.

## 후속 작업 키워드 매칭

이 스킬은 다음 표현에 반드시 트리거되어야 함:
- "원우회 앱 다시", "재실행", "업데이트", "보완", "수정"
- "디자인만 다시", "백엔드만 다시", "QA만 다시"
- "이전 결과 기반으로"
- "결과 개선", "리뷰 반영"
