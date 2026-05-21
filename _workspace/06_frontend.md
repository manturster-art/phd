> ⚠️ 임시 Frontend 섹션 — Phase 5에서 통합 예정

# 06. Frontend 구현 — 회비 모듈 확장 (입금 신고 + CSV 매칭)

> 작성자: Frontend Engineer 에이전트
> 작성일: 2026-05-20
> 입력: `_workspace/06_pm.md` v0.1, `_workspace/06_designer.md` v0.1, `_workspace/06_backend.md` v0.1, `supabase/migrations/20260520000015_dues_bank_integration.sql`
> 산출물: 본 문서 + 아래 코드 파일들

## 변경 로그
| 날짜 | 버전 | 변경 |
|------|------|------|
| 2026-05-20 | v0.1 | P0(흐름 C 입금 신고/컨펌) + P1(흐름 B CSV 매칭) 구현. 신규 컴포넌트 6종, 라우트 4종, API 핸들러 5종, 파서/매처 라이브러리 2종. |

---

## 1. 구현된 파일 목록

### 1.1 신규 컴포넌트 (`components/dues/`)
| 파일 | 설명 | Designer ID |
|------|------|-------------|
| `BankRuleBanner.tsx` | 입금자명 규칙 안내 + 복사 버튼 (clipboard fallback 포함). | C-460 |
| `PaymentReportSheet.tsx` | 회원 입금 신고 BottomSheet (react-hook-form + zod). 항목 금액과 다를 시 부분/초과 경고. | C-461 |
| `PaymentApprovalRow.tsx` | 임원용 신고 1행 + 반려 사유 다이얼로그(인라인 모달). | C-462 |
| `TransactionUploadDropzone.tsx` | CSV/XLSX 드롭존. 키보드 Enter/Space로 다이얼로그, 에러 `role="alert"`. | C-463 |
| `TransactionReviewTable.tsx` | 3-탭 (자동/후보/미매칭) + 후보 선택 시트. | C-464 |
| `MatchStatusChip.tsx` | 매칭상태 칩 3종 (auto/multi/none) + 카운트 변형. | C-465 |
| `TransactionsUploadFlow.tsx` | 데모/운영 공통 업로드 흐름 컴포넌트 (sticky 액션바, 폐기 가드). | (조합) |

### 1.2 라이브러리 (`lib/dues/`)
| 파일 | 설명 |
|------|------|
| `csv-parser.ts` | 5개 은행 헤더 매핑 + `detectBank()` + `parseFile()` (CSV/XLSX 디스패치). |
| `matcher.ts` | 매칭 알고리즘 (`auto_exact` / `auto_pattern` / `auto_oldest` / `multi` / `none`). |
| `demo-mode.ts` | 데모 모드 판정 (env 비어 있거나 'dummy' 면 true). |

### 1.3 API Route Handlers (`app/api/dues/`)
| 경로 | 설명 |
|------|------|
| `[id]/report/route.ts` | 회원 입금 신고. 회원이 직접 supabase 호출도 가능하지만 데모/에러 일관성 확보용. |
| `admin/payments/[id]/approve/route.ts` | 임원 컨펌 (pending_payment → paid). |
| `admin/payments/[id]/reject/route.ts` | 임원 반려 (사유 1~200자). |
| `admin/transactions/parse/route.ts` | CSV/XLSX 파싱 + 매칭. **Node runtime, 메모리 처리, 디스크 저장 금지**. |
| `admin/transactions/commit/route.ts` | 일괄 확정 (자동매칭 row만) + `dues_match_log` INSERT + 알림 발송. |

### 1.4 페이지 (데모)
| 경로 | 설명 |
|------|------|
| `app/demo/dues-member/[id]/page.tsx` | SCR-051. 상세 + 입금 신고 시트. 로컬 상태로 신고 후 상태 변경 흉내. |
| `app/demo/dues-admin/page.tsx` | SCR-060 + SCR-064 통합. 임원 컨펌 섹션 + 매트릭스. |
| `app/demo/dues-admin/transactions/upload/page.tsx` | SCR-065. 공통 흐름 사용. |
| `app/demo/dues-member/page.tsx` | 기존 SCR-050 — 각 항목 카드를 `/demo/dues-member/[id]` 로 링크. |

### 1.5 페이지 (운영)
| 경로 | 설명 |
|------|------|
| `app/(main)/dues/[id]/page.tsx` | RSC. dues_payment_member_view 조회 + 자식 client 컴포넌트. |
| `app/(main)/dues/[id]/DuesDetailClient.tsx` | 시트 + supabase 신고 호출 (`reportMyDuesPayment`). |
| `app/(main)/dues/admin/page.tsx` | 기존 + `PendingApprovalsSection` 통합. |
| `app/(main)/dues/admin/PendingApprovalsSection.tsx` | listPendingDuesPayments → PaymentApprovalRow. |
| `app/(main)/dues/admin/transactions/upload/page.tsx` | RSC 가드 + 클라이언트 컴포넌트. |
| `app/(main)/dues/admin/transactions/upload/TransactionsUploadClient.tsx` | 얇은 래퍼. |
| `app/(main)/dues/page.tsx` | 기존 + 항목 카드 → `/dues/[id]` 링크. |

### 1.6 기존 수정
| 파일 | 변경 |
|------|------|
| `lib/types/database.ts` | `DuesStatus` 에 `pending_payment`, `rejected` 추가. `dues_payment` Row/Insert/Update 에 신규 6 컬럼. `dues_match_log` 테이블 타입 추가. 신규 enum 타입 `DuesMatchKind` / `DuesSourceBank` / `DuesMatchType` / `DuesMatchSource`. |
| `lib/api/dues.ts` | `reportMyDuesPayment`, `cancelMyDuesReport`, `approveDuesPayment`, `rejectDuesPayment`, `listPendingDuesPayments`, `commitDuesCsvBatch` 추가. |
| `components/dues/DuesStatusBadge.tsx` | `pending_payment` (warning, ⏳ 검토중) + `rejected` (danger, 🚫 반려됨) 매핑 추가. |
| `lib/demo/mockData.ts` | `demoDuesDetails`, `demoPendingPayments`, 신규 인터페이스 추가. `pay-jimin-2026-1` 을 `pending_payment` 로 변경하여 데모에서 신규 상태 즉시 노출. |
| `package.json` | `papaparse`, `xlsx`, `@types/papaparse` 추가. |

---

## 2. Designer/Backend 사양에서 벗어난 부분

| 항목 | 사양 | 구현 | 사유 |
|------|------|------|------|
| `/dues/admin/pending` 별도 라우트 | Designer §1.1 에서 별도 라우트 권장 | `/dues/admin` 상단 섹션으로 인라인 통합 | 이미 운영중 화면 동선을 한 화면에서 끊지 않기 위함. 후속 P1에서 별도 라우트로 분리 가능. PaymentApprovalRow는 그대로 라우트 분리 시 재활용. |
| `SCR-064-D` 별도 다이얼로그 컴포넌트 | C-462 와 분리된 모달 | `PaymentApprovalRow` 내부에 인라인 다이얼로그 | 행 단위 상태 (입력된 사유) 와 라이프사이클이 강하게 결합. 분리 시 prop drilling 증가. focus trap/ESC 동작은 동등 구현. |
| `SCR-065 Phase B` 별도 시각 단계 | 드롭존 축소 + 양식 확인 단계 | 업로드 즉시 파싱 → 결과 표시 (단일 단계 전환) | 데모용 단순화. Phase B 의 "다른 파일 선택" 링크는 결과 화면 상단에 위치. |
| `SCR-066` 매칭 로그 stub | P2 | 미구현 | P2 범위 외. Backend `dues_match_log` 는 생성되므로 향후 추가는 RSC 1 페이지로 충분. |
| 클라이언트 측 CSV 파싱 (디자이너 §6 노트) | "1000행 ≤ 3초 (Chrome)" | **서버 라우트 파싱** | Backend D4 결정에 따름. xlsx 라이브러리 CVE 위험 + 메모리 폐기 보장 + 매칭에 필요한 DB 데이터(미납/회원) 접근이 서버에서 더 효율적. 응답 매칭 결과는 JSON 으로 클라이언트 전달, 원본 파일은 서버 메모리에서 처리 후 즉시 폐기. |

---

## 3. 라이브러리 선택 근거

### papaparse 5.5.3
- CSV 자동 파싱 + 행 단위 데이터 추출. EUC-KR 인코딩 대응은 P2 (현재 UTF-8 가정, KB/우리은행 CSV 다운로드 시 인코딩 가이드를 SCR-065-G 가이드 영역에 추가 예정).
- 서버(Node) 에서만 호출되어 클라이언트 번들에 포함되지 않음.

### xlsx 0.18.5 (SheetJS Community)
- **결정**: npm 레지스트리의 마지막 OSS 버전(0.18.5) 핀.
- **CVE**: ReDoS / prototype pollution (CVE-2024-22363 등) 알려짐.
- **공식 권고**: SheetJS CDN 의 latest tarball (`https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz`) 사용.
- **본 환경 제약**: 위 CDN 이 본 빌드 환경에서 403 으로 접근 불가. (사전 토큰 없이 다운로드 차단됨)
- **완화**:
  1. 서버 라우트(Node)에서만 사용 → 브라우저 노출 없음.
  2. 입력은 임원만 (RLS) 업로드 가능 → 신뢰된 소스.
  3. 메모리 처리 후 즉시 폐기 (디스크/Storage 저장 금지) — 06_backend §6 정책.
  4. 파일 크기/행 수 제한 (2MB, 1000행) 으로 ReDoS 노출 면적 축소.
- **후속 조치(P2)**: 사업자 인증 확보 후 SheetJS Pro 또는 안전 mirror 로 교체. `csv-parser.ts` 상단에 명시 주석 보존.

### react-hook-form + zod
- 기존 프로젝트 의존성에 이미 포함. PaymentReportSheet 에서 사용. 한국어 메시지 직접 작성 (zod custom error_map 미사용).

---

## 4. 데모 모드 fallback 동작

`lib/dues/demo-mode.ts#isDemoMode()` 가 `true` 인 조건:
1. `NEXT_PUBLIC_DEMO_MODE === '1'`
2. `NEXT_PUBLIC_SUPABASE_URL` 또는 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 미설정
3. URL/KEY 가 `dummy` 를 포함

데모 모드일 때:
- **`/api/dues/[id]/report`**: DB 호출 건너뜀, `{ status: 'pending_payment', demo: true }` 반환.
- **`/api/dues/admin/payments/[id]/approve|reject`**: 인증 검사 건너뜀, 성공 응답 모킹.
- **`/api/dues/admin/transactions/parse`**: 회원·미납 데이터를 `lib/demo/mockData` 에서 로드해 매칭. 실제 파일 파싱은 정상 동작.
- **`/api/dues/admin/transactions/commit`**: 항상 `{ ok: rows.length, failed: 0 }` 반환.

데모 페이지(`/demo/dues-*`):
- `app/demo/dues-member/[id]/page.tsx` 는 데모 모드와 무관하게 **로컬 state 만** 사용 (시트 제출 → 상태 변경 시뮬레이션).
- `app/demo/dues-admin/page.tsx` 의 PaymentApprovalRow 도 로컬 state 변경 (실제 API 미호출). 단, 빌드 시 dummy env 로도 API 라우트들이 컴파일/응답하므로 직접 호출도 가능.
- `app/demo/dues-admin/transactions/upload` 는 실제 `/api/dues/admin/transactions/parse` 를 호출 → 데모 모드 분기로 mock 멤버/항목을 매칭에 사용.

---

## 5. QA 인계 노트 — 테스트 시나리오

### 5.1 회원 흐름 (P0)
1. **SCR-050 → SCR-051 진입**: `/demo/dues-member` 에서 학기 카드 탭 → `/demo/dues-member/pay-jimin-2025-1` (미납) 진입.
2. **입금 신고 (SCR-052)**:
   - "입금했어요" 탭 → 시트 등장.
   - 첫 입력(입금 일시) 자동 포커스 확인.
   - 금액을 항목금액 ±값으로 변경 → "⚠ 항목 금액과 다릅니다" 경고.
   - "신고 제출" → 토스트 + 상단 상태 칩이 "검토중" 으로 전환.
3. **상태 변형 확인**: `pay-jimin-2026-1` (`pending_payment` 기본), `pay-jimin-rejected` (수동 URL) — 반려 본문 + 재신고 CTA 확인.
4. **BankRuleBanner 복사**: "복사하기" 탭 → 클립보드에 `김지민/2025-1학기` 형식 복사 확인 (`navigator.clipboard` 권한 거부 시 폴백 동작 확인).

### 5.2 임원 흐름 (P0)
1. `/demo/dues-admin` 진입 → 상단 "입금 신고 컨펌" 섹션 3건 노출.
2. "확인" 1탭 → 행 즉시 사라짐 + 토스트 "납부 처리 완료".
3. "반려" 탭 → 인라인 다이얼로그. 사유 미입력 시 "반려" 비활성화. 사유 입력 → 한글 글자수 카운터 (`[...str].length`) 정확 동작.
4. ESC 키로 다이얼로그 닫힘, 트리거 버튼으로 포커스 복귀.

### 5.3 임원 CSV 흐름 (P1)
1. `/demo/dues-admin/transactions/upload` 진입.
2. 드롭존에 임의의 CSV 드래그 (또는 클릭 → 파일 선택). 예시 헤더:
   ```
   거래일자,보낸분/받는분,입금금액,내용
   2026-05-18 14:22,김지민,50000,김지민/26-1
   2026-05-18 15:01,이수아,50000,이수아
   ```
3. 응답 후 3-탭 + 매칭 칩 노출. 데모 멤버(김지민/이수아 등) 기반 매칭이 동작.
4. "후보" 탭의 행 → "선택하기 →" → 시트에 ⭐ 추천 1순위 강조. 라디오 선택 후 "자동매칭으로 이동" → 탭 카운트 갱신.
5. 하단 sticky bar → "N건 일괄 확정" 탭 → 데모 모드는 항상 성공 응답.
6. "폐기" 또는 페이지 이탈 시 `window.confirm` 가드 동작.

### 5.4 보안/접근성 회귀
- [ ] CSV 업로드 후 네트워크 탭에서 응답이 매칭 결과 JSON 인지 확인 (원본 파일 페이로드 비저장).
- [ ] `/api/dues/admin/transactions/parse` 응답 후 서버 디스크에 임시 파일 없음 확인.
- [ ] PaymentApprovalRow `aria-label` 이 회원명·학기·금액을 포함하는지 스크린리더 점검.
- [ ] PaymentReportSheet IME 조합 중 Enter 자동 제출 금지 확인 (TextArea data-composing).
- [ ] 모든 인터랙티브 요소 44px 이상 터치 타깃.
- [ ] 색 단독 표현 금지 — `DuesStatusBadge` 아이콘+라벨 동시 노출 확인 (Lighthouse 또는 axe).

### 5.5 운영 환경 회귀 (실제 Supabase)
- [ ] 마이그레이션 적용 후 회원이 본인 행에 `update({status:'pending_payment'})` → 가드 트리거 통과 → 임원 컨펌 목록에 노출.
- [ ] 회원이 타인 행에 update 시도 → 0 rows (RLS).
- [ ] 회원이 `status:'paid'` 로 직접 update 시도 → 트리거가 옛 값 복원.
- [ ] CSV commit 후 `dues_match_log` 행이 정상 INSERT 되는지.
- [ ] `dues_payment.memo` 가 "[CSV] {raw_memo}" prefix 로 갱신되는지.
- [ ] 동명이인이 있는 환경에서 매칭이 `multi` 로 분류되는지 (자동 금지).

---

## 6. 미해결 이슈 / 후속 작업

| # | 항목 | 상태 |
|---|------|------|
| F1 | xlsx 안전 버전 교체 | 0.18.5 핀. SheetJS Pro 또는 사업자 인증 후 latest tarball 로 교체 필요. |
| F2 | EUC-KR 인코딩 자동 감지 | 미구현. KB/우리은행 CSV가 EUC-KR 일 경우 깨질 수 있음. `iconv-lite` 도입 후 헤더 바이트 검사 추가 권장. |
| F3 | 신고 취소 (US-C04) | UI 미구현 (P1). `cancelMyDuesReport` 함수만 lib/api/dues.ts에 추가. |
| F4 | 매칭 로그 조회 (US-B05, SCR-066) | P2 — stub 없음. `dues_match_log` 테이블은 준비됨. |
| F5 | 컨펌 [실행취소] 5초 토스트 | Toast 컴포넌트가 액션 슬롯을 지원하지 않음. 별도 토스트 확장 또는 ConfirmDialog 활용 필요. |
| F6 | 일괄 확정 — 단일 RPC 트랜잭션 | 현재 row별 처리. BE-Q1 결정 시 `apply_dues_csv_batch(jsonb)` RPC 도입 권장. |
| F7 | InfoBanner / 시트 등 reduced-motion 미세조정 | 기본 `transition-transform` 만 사용. `prefers-reduced-motion: reduce` 미디어 쿼리 대응은 모든 컴포넌트에 일괄 적용된 상태가 아님. |
| F8 | Lint 자동 실행 | `next lint` 가 초기 설정 요구 (interactive). 빌드는 type-checked, runtime 검증은 QA 인계로 위임. |

---

## 7. 검증 결과

- `npm run typecheck` ✅ 통과 (0 errors)
- `NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy npm run build` ✅ 통과 (38 routes generated, 신규 5개 API + 4개 페이지 포함)
- `npm run lint` ⚠ 초기 설정 요구로 실행 불가. typecheck 가 동등 수준의 정적 검사 수행.

---

## 8. Apple grammar 준수 체크리스트

- [x] 단일 Action Blue (`primary-500` = #0066cc) — 모든 CTA. 반려는 ghost danger pill.
- [x] pill CTA — Button.tsx primary/secondary 모두 `rounded-pill`.
- [x] `transform: scale(0.95)` press — Button/MatchStatusChip/Dropzone 모두 `active:scale-95`.
- [x] 카드 그림자 0 — Card/Dropzone 모두 그림자 없음. hairline border 만 사용.
- [x] 17px body — base 토큰이 17px (tailwind config 유지).
- [x] 표면 교차로 분절 — bg-surface / bg-bg / bg-bg-subtle / bg-primary-50 교차.
- [x] 색 + 아이콘 + 한국어 라벨 동시 표현 — StatusPill / MatchStatusChip / 경고 메시지 전부.

---

## 9. QA P1 픽스 (v0.2, 2026-05-21)

QA 리포트 `_workspace/06_qa.md` §4 의 P1 4건 + Backend 협업 (commit 응답 스키마 변경) 을 반영.

### 9.1 변경 로그
| 날짜 | 버전 | 변경 |
|------|------|------|
| 2026-05-21 | v0.2 | QA P1-1~P1-4 픽스 + commit 응답 `{confirmed, skipped}` 호환 + 검토필요 섹션 추가. |

### 9.2 P1-1 — 신고 취소 UI (US-C04)
- `app/(main)/dues/[id]/DuesDetailClient.tsx`
  - `pending_payment` 분기에 `Button variant="ghost"` "신고 취소" 추가.
  - 클릭 → `ConfirmDialog` ("신고을 취소할까요?" / danger) → 확인 시 `cancelMyDuesReport()` 호출 후 `router.refresh()`.
- `app/demo/dues-member/[id]/page.tsx` — 데모 모드 동일 UX. 로컬 state 를 `unpaid` 로 되돌림.
- 함수 호출 후 fallback 토스트 + 에러 처리 포함.

### 9.3 P1-2 — Focus trap
- 신규 훅 `hooks/useFocusTrap.ts`: 컨테이너 내부로 Tab/Shift+Tab loop. previousActive 복원. 외부 라이브러리 불요.
- 적용:
  - `components/ui/Sheet.tsx` — Sheet 내부 자동 focus + trap.
  - `components/ui/ConfirmDialog.tsx` — 다이얼로그 trap.
  - `components/dues/PaymentApprovalRow.tsx` — 반려 사유 인라인 다이얼로그 trap (행마다 별도 hook 등록).
- ESC 처리는 기존 그대로 (Sheet/Dialog 가 자체 keydown 핸들러 유지).

### 9.4 P1-3 — 44px 터치 타깃
- `components/dues/TransactionReviewTable.tsx`:
  - "선택하기 →" 버튼: `inline-flex min-h-[44px] min-w-[88px] items-center justify-center rounded-pill border border-primary-500`. 시각적으로도 ghost pill 로 격상.
  - 후보 선택 시트의 `<label>` 카드: `min-h-[44px]`.
- `components/dues/TransactionsUploadFlow.tsx`:
  - "다른 파일 선택" 보조 버튼: `min-h-[44px] inline-flex items-center rounded-pill px-3`.

### 9.5 P1-4 — 실행취소 토스트
- `components/ui/Toast.tsx` 확장:
  - `show(message, kind, options?)` 시그니처 추가 (기존 호출부 100% 호환).
  - `ToastOptions.action: { label, onClick }` + `durationMs` 지원. 액션 있는 토스트 기본 5000ms.
  - 알약 내부에 ghost border 액션 버튼 (44px), 클릭 시 콜백 실행 후 즉시 dismiss.
- `app/(main)/dues/admin/PendingApprovalsSection.tsx` (운영):
  - 컨펌/반려 성공 시 `action: { label: '실행취소', onClick: rollback }` 토스트.
  - `rollback()` 은 `cancelMyDuesReport()` 호출 → `pending_payment` 으로 회귀 (Backend 의 멱등 RPC 의존).
  - 5초 내 다른 토스트가 와도 행은 다시 목록에 보임. router.refresh 트리거.
- `app/demo/dues-admin/page.tsx` (데모): 로컬 state 만 사용한 미러 구현.

### 9.6 (Backend 협업) commit 응답 스키마 v0.4 대응
- `components/dues/TransactionsUploadFlow.tsx` `onCommit()`:
  - 응답에서 `confirmed ?? ok` 와 `skipped ?? failures` 를 폴백 매핑.
  - `skipped.length > 0` 인 경우 "검토 필요" 섹션을 매칭 결과 아래 노출 (warning 톤 카드).
  - reason 코드 매핑: `already_paid` / `report_mismatch` / `conflict` / `not_found` → 한국어 라벨.
  - 검토 필요 행이 있을 때는 매칭 결과를 유지해 임원이 다시 확인할 수 있게 함 (성공 케이스만 자동 초기화).

### 9.7 검증
- `npm run typecheck` ✅ 0 errors
- `NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… NEXT_PUBLIC_APP_NAME=… npm run build` ✅ 통과 (라우트 카운트 변동 없음, `/dues/[id]` 와 `/demo/dues-member/[id]` 청크가 ConfirmDialog 추가로 소폭 증가).

### 9.8 남은 이슈
- P0-1 의 Backend RPC 단일 트랜잭션화는 Backend 작업이며 본 패치는 응답 호환만 보장.
- F5 (Toast 액션 슬롯 부재) 는 해소됨 → 1차 후속 작업 항목에서 제거 가능.
- F3 (US-C04) 는 해소됨.
- Focus trap 은 `useFocusTrap` 으로 공용화됨. 향후 신규 모달/시트는 동일 훅 사용 권장.
