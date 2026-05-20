> ⚠️ 임시 Designer 섹션 — Phase 5에서 통합 예정

# 06. Designer 설계 — 회비 모듈 확장 (입금 신고 + CSV 매칭)

> 작성자: Designer 에이전트 · 작성일: 2026-05-20
> 기반: `06_pm.md` v0.1, `02_designer_uiux.md` v0.1, `external/apple-design-system.md`, `tailwind.config.ts`
> 뷰포트: 모바일 360~414px / 데스크톱 max-w 720px
> 원칙: Apple grammar — 단일 Action Blue(#0066cc), pill CTA, `scale(0.95)` press, **카드 그림자 0**, 17px body, 표면 교차로만 분절

## 변경 로그
| 날짜 | 버전 | 변경 |
|------|------|------|
| 2026-05-20 | v0.1 | 회비 확장 — 흐름 C(P0) + 흐름 B(P1). 신규 화면 6, 신규 컴포넌트 6 (C-460~465). |

---

## 1. 신규 화면 목록

> 기존 IA(02_designer §1.2)를 **add-only** 로 확장. ID 슬롯 SCR-051/052/064/065/066 신설 (기존과 충돌 없음).

### 1.1 P0 (흐름 C)
| ID | 라우트 | 진입 | 권한 |
|----|--------|------|------|
| **SCR-051** | `/dues/[itemId]` 회원측 항목 상세 | SCR-050에서 학기 카드 탭 | 본인/임원/관리자 |
| **SCR-052** | SCR-051 내 `PaymentReportSheet` | "입금했어요" 탭 | 본인만 |
| **SCR-064** | `/dues/admin/pending` 컨펌 목록 | SCR-060 ⋮ → "입금 신고 컨펌(N)" | 임원/관리자 |
| **SCR-064-D** | `RejectReasonDialog` | 컨펌 행 "반려" 탭 | 임원/관리자 |

### 1.2 P1 (흐름 B)
| ID | 라우트 | 진입 | 권한 |
|----|--------|------|------|
| **SCR-065** | `/dues/admin/transactions/upload` CSV 업로드·매칭 | SCR-060 ⋮ → "거래내역 업로드" | 임원/관리자 |
| **SCR-065-G** | `UploadGuideSheet` | SCR-065 상단 "지원 양식 →" | 동일 |
| **SCR-066** | `/dues/admin/transactions/log` 매칭 로그 (P2 stub) | SCR-065 하단 링크 | 임원/관리자 |

### 1.3 IA 변경
```
회비 (DUES)
├─ /dues                                    [회원] 기존 SCR-050
│   └─ /dues/[itemId]                       [회원] 항목 상세  ◀ SCR-051
│       └─ PaymentReportSheet               ◀ SCR-052
├─ /dues/admin                              [임원] 기존 SCR-060
│   ├─ /dues/admin/pending                  ◀ SCR-064
│   ├─ /dues/admin/transactions/upload      ◀ SCR-065 (P1)
│   └─ /dues/admin/transactions/log         ◀ SCR-066 (P2)
└─ /dues/admin/items                        [임원] 기존 SCR-061
```
> **임원 진입 동선**: SCR-060 우상단 `⋮` 메뉴를 3-item으로 확장 — ①항목 관리(기존) ②입금 신고 컨펌(배지 N) ③거래내역 업로드(P1). pending ≥1건이면 메뉴 아이콘 옆 `primary-500` 4px dot.

---

## 2. 와이어프레임 (모바일 360~414px)

### SCR-051 회비 항목 상세 (회원)
```
┌──────────────────────────────┐
│ ← 회비                        │  AppBar back
├──────────────────────────────┤
│ 2026-1학기 회비               │  4xl/600/-0.02em
│ 50,000원 · 마감 4/30          │  lg/text-secondary
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ 입금자명을 다음 형식으로  │ │
│ │ 적어주세요               │ │  C-460 BankRuleBanner
│ │   김지민/2026-1학기      │ │  bg=primary-50 (#f5f5f7)
│ │   [📋 복사하기]          │ │  1px border-default, radius-lg
│ │   우리은행 1234-5678-…   │ │  예금주: 원우회 박현우
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ 내 상태                       │  caption-strong
│  ❌ 미납                      │  StatusPill (danger)
│  계좌이체 후 아래 버튼을      │  sm/text-secondary
│  눌러주세요                   │
│  ┌────────────────────────┐  │
│  │     입금했어요          │  │  button-primary pill 44px
│  └────────────────────────┘  │  scale(0.95)
└──────────────────────────────┘
```

**상태별 본문 (동일 화면, 본문만 교체)**

| 상태 | 표시 |
|------|------|
| `pending_payment` | ⏳ **검토중** (warning pill) · "5/20 14:32 신고 · 50,000원" · [신고 취소] (P1, ghost) · "처리되면 알림으로 알려드릴게요." |
| `rejected` | 🚫 **반려됨** (danger pill) · 사유 전문(base/400 ink) · "5/20 16:10 처리" · CTA [**다시 신고하기**] (primary) |
| `paid` | ✅ **납부완료** (success pill) · "5/20 14:00 입금 · 50,000원" · 메모(공개 시) |
| `exempt` | ⚪ **면제** (neutral) · 메모(공개 시) |

### SCR-052 입금 신고 시트
```
┌──────────────────────────────┐
│ ──                            │  drag handle 4px
│ 입금 신고                     │  xl/600
│ 2026-1학기 · 50,000원         │  sm/text-secondary
├──────────────────────────────┤
│ 입금 일시 *                   │  caption-strong
│ [2026.05.20(수) 14:32   📅] │  TextField, default=now
│                               │
│ 금액 *                        │
│ [50,000              원]      │  inputmode=numeric, default=항목금액
│ ⚠ 항목 금액과 다릅니다.       │  warning + 아이콘 (다를 때만)
│   부분/초과 납부로 신고됩니다 │
│                               │
│ 메모 (선택)                   │
│ [____________________]        │  TextArea rows=2, max 200
├──────────────────────────────┤
│ [취소]   [   신고 제출    ]  │  sticky bottom + sab
└──────────────────────────────┘
```
- 시트 max-h 90dvh, 컨텐츠 scroll. 키보드 등장 시 "신고 제출" 가시 유지.
- 제출 → 시트 슬라이드 다운(220ms) → SCR-051 상태칩 fade+6px slide-up → Toast "신고가 접수되었어요. 임원이 확인하면 알림으로 알려드릴게요." (info/4s).

### SCR-064 입금 신고 컨펌 목록 (임원)
```
┌──────────────────────────────┐
│ ← 입금 신고 컨펌    3건 대기  │  AppBar + 우측 caption
├──────────────────────────────┤
│ 신고 시각이 오래된 순          │  xs/text-muted
├──────────────────────────────┤
│ 김지민 · 2026-1학기           │  base/600
│ 50,000원 · 5/20 14:32 신고    │  sm/text-secondary
│ 메모: 4월 10일 입금            │  sm/text-primary
│       [반려]  [   확인    ]  │  ghost-danger / primary, 우측정렬
├──────────────────────────────┤  1px hairline
│ 이수아 · 2026-1학기           │
│ 30,000원 · 5/20 15:01 신고    │
│ ⚠ 항목 금액(50,000원)과 다름  │  warning 캡션 (자동)
│       [반려]  [   확인    ]  │
├──────────────────────────────┤
│ ...                           │
└──────────────────────────────┘
```
- 행 사이 1px hairline만, 그림자 0.
- "확인" 1탭 → 즉시 fade out(180ms) + 리스트 reflow(FLIP 220ms) + 토스트 "납부 처리 완료 · [실행취소]" (5초).
- "반려" → SCR-064-D 다이얼로그.

**빈 상태 (SCR-064-Empty)**: 📭 "대기 중인 신고가 없습니다" (lg/600) + "회원이 '입금했어요'를 누르면 여기에 표시됩니다" (sm/text-secondary). C-250 EmptyState 재사용.

### SCR-064-D 반려 사유 다이얼로그
```
┌──────────────────────────────┐
│ 김지민님 신고 반려             │  lg/600
│ 2026-1학기 · 50,000원         │  sm/text-secondary
│ 사유 * (회원에게 표시됩니다)  │  caption-strong
│ [_______________________]    │  TextArea rows=3, 1~200자, 필수
│                       0/200  │  xs/text-muted, 우측정렬
│  [취소]  [   반려       ]   │  우=ghost-danger pill (border+text-danger)
└──────────────────────────────┘
```
> **Apple grammar 적용**: "반려"는 빨간 fill 아닌 **ghost danger pill**(border+text-danger, 투명 배경). 단일 Action Blue 원칙 유지하면서 위험은 색+라벨로 동시 표시.

### SCR-065 거래내역 업로드 (3-Phase, 단일 URL)

**Phase A — 업로드 전**
```
┌──────────────────────────────┐
│ ← 거래내역 업로드             │
├──────────────────────────────┤
│ 지원: KB·신한·우리·카카오·토스 │
│              [지원 양식 →]   │  text-link
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │          ⬆                │ │  C-463 Dropzone
│ │  CSV/XLSX 파일을 끌어다  │ │  bg=bg-subtle, 2px dashed border
│ │  놓거나 눌러서 선택        │ │  rounded-lg, padding 48px
│ │  최대 2MB · 1,000행       │ │  min-h 200px
│ └──────────────────────────┘ │
│ ⓘ 업로드한 파일은 매칭 처리   │  InfoBanner (bg=primary-50)
│   후 즉시 폐기되며 서버에     │  base/400 + ⓘ
│   저장되지 않습니다.          │
└──────────────────────────────┘
```

**Phase B — 인식 직후**: 드롭존이 200→80px 축소(320ms emphasized) + "✅ 신한은행 양식 인식됨 · 142건" inline + [다른 파일 선택] (text-link).

**Phase C — 매칭 결과 (메인)**
```
┌──────────────────────────────┐
│ ← 거래내역 업로드             │
│ 신한은행 · 142건              │  sm/text-secondary
│ ✅ 자동매칭 118 ⚠후보 18 ❌미매칭 6 │ SegmentedControl 3-tab
│ ──────────                    │  활성 탭 1px Action Blue underline
├──────────────────────────────┤
│ ┌──────────────────────────┐ │  TransactionReviewTable row
│ │ 5/18 14:22                │ │
│ │ 김지민 · 50,000원          │ │
│ │ 메모: 김지민/26-1          │ │
│ │ ──────                    │ │  1px hairline
│ │ → 김지민·2026-1학기 회비  │ │  매칭된 회원·항목 base/600
│ │ [자동] MatchStatusChip    │ │  C-465 (primary tone)
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ 이수아 · 50,000원 / 후보 3 │ │
│ │ [후보] [선택하기 →]       │ │  warning chip + text-link
│ └──────────────────────────┘ │
│ (미매칭 탭: [수동 매칭 →])    │
├──────────────────────────────┤
│ ── sticky bottom action ──   │
│ 자동매칭 118건만 확정됩니다    │  xs/text-secondary
│ ⓘ 파일은 처리 후 폐기됩니다   │
│ [폐기]   [ 118건 일괄 확정 ] │  ghost-danger / primary-pill
└──────────────────────────────┘
  bg=canvas-parchment 80% + blur, z=bottomBar, sab
```

**후보 선택 시트 (US-B03)**: 시트 안에 후보 N개 라디오 카드. 1순위(가장 오래된 미납)는 ⭐ + `border 2px primary-focus` 강조 + "추천" 라벨. 선택 → "자동매칭으로 이동" → FLIP 220ms 애니메이션으로 다른 탭에 추가됨.

### SCR-065-G 업로드 가이드 모달
지원 5개 은행 bullet 목록 + 헤더(일자/입금자명/금액/메모) 컬럼 안내 + 폐기 정책 ⚠ 박스 + [닫기]. 단순 modal, sm/text-primary 본문.

---

## 3. 상태별 표시 매트릭스

| 상태 | 토큰 fg/bg | 아이콘 | 라벨 | SCR-050 카드 | SCR-051 상세 | SCR-060 매트릭스 | SCR-064 컨펌 |
|------|------------|--------|------|--------------|--------------|------------------|---------------|
| `unpaid` | danger/danger-bg | ❌ | 미납 | ○ | 본문 + "입금했어요" CTA | ○ | — |
| `pending_payment` | warning/warning-bg | ⏳ | 검토중 | 칩+신고시각 | 본문+신고 메타+[취소(P1)] | 행 칩 | **목록 1행** |
| `paid` | success/success-bg | ✅ | 납부완료 | ○ | 본문+입금시각/메모 | ○ | 제거 |
| `rejected` | danger/danger-bg | 🚫 | 반려됨 | 사유 truncate | 본문+사유 전문+[다시 신고] | 행 칩 | 즉시 자동 `unpaid` 복귀 |
| `exempt` | text-secondary/neutral-bg | ⚪ | 면제 | ○ | 본문+메모 | ○ | — |
| `partial` | warning/warning-bg | 🟡 | 부분납부 | ○ | 본문+신고/실수령 | ○ | — |

**매칭 상태 (SCR-065 전용)**:
| kind | 토큰 | 라벨 | 액션 |
|------|------|------|------|
| `auto` | primary-500/primary-50 | 자동 | 일괄 확정 대상 |
| `multi` | warning/warning-bg | 후보 | 시트에서 1개 선택 → `auto` 전환 |
| `none` | text-muted/neutral-bg | 미매칭 | 수동 매칭 또는 제외 |

---

## 4. 신규 컴포넌트 카탈로그 (C-46x)

### C-460 BankRuleBanner — 입금자명 규칙 + 복사
- **Props**: `memberName: string`, `termLabel: string`, `bankInfo: {bank, account, owner}`, `onCopy?`
- **State**: `copied: boolean` (2초간 "복사됨 ✓")
- **토큰**: bg=`primary-50`, border 1px `border-default`, radius-lg, padding 24px, 본문 base/400, 예시값 lg/600, 복사 = `text-link` (Action Blue)
- **변형**: (a) default SCR-051용 (b) compact — SCR-050 카드 inline 미니(P1 검토)
- **접근성**: 복사 버튼 `aria-label="입금자명 예시 복사"`, `aria-live="polite"` 영역에서 "복사되었습니다" 알림

### C-461 PaymentReportSheet — 회원 입금 신고 시트
- **Props**: `open`, `itemId`, `defaultAmount`, `onClose`, `onSubmitted`
- **State**: `paidAt` (default=now), `amount` (default=defaultAmount), `memo`, `submitting`, `amountDiffWarning`
- **토큰**: Sheet container bg-surface + radius-lg 상단(16/16, 하단 0), 기존 TextField/TextArea, 경고 warning fg/bg, CTA button-primary 44px, sab=`env(safe-area-inset-bottom)`
- **변형**: 신규 신고 / **재신고**(rejected 진입 시 상단 회색 박스 "이전 사유: …")
- **접근성**: 열림 시 첫 필드 포커스, ESC 닫기, focus trap, 숫자=`inputmode="numeric"`

### C-462 PaymentApprovalRow — 임원 컨펌 1행
- **Props**: `report: {memberName, cohort, termLabel, amount, reportedAt, memo, amountMismatch}`, `onApprove`, `onReject`
- **State**: `processing` (행 dim + 12px 스피너)
- **토큰**: 행 padding 16px, 1px hairline bottom, 이름 base/600, 메타 sm/text-secondary, 경고 warning, 버튼 우측 8px gap, 둘 다 min-h 44px
- **변형**: (a) 기본 (b) 금액 불일치 (c) processing dim
- **접근성**: `role="group"`, `aria-label="김지민 2026-1학기 5만원 신고. 확인 또는 반려"`
- **인터랙션**: 확인 1탭 → fade 180ms → 제거 + 5초 [실행취소] 토스트

### C-463 TransactionUploadDropzone — 파일 드롭존
- **Props**: `accept` ([.csv, .xlsx]), `maxSizeBytes` (2MB), `maxRows` (1000), `onFile`, `disabled?`
- **State**: `dragOver`, `error: string|null`, `file: File|null`, `detecting`
- **토큰**: bg=`bg-subtle` → dragOver 시 `primary-50`, 2px dashed border → dragOver 시 solid `primary-500`, radius-lg, padding 48px, min-h 200px, 아이콘 text-muted 32px, 에러 danger fg+아이콘
- **변형**: idle / dragOver / detecting (스피너) / detected (축소) / error
- **접근성**: input[type=file] sr-only + label 연결, Enter/Space=파일 다이얼로그, 에러 `role="alert"`

### C-464 TransactionReviewTable — 매칭 결과
- **Props**: `transactions`, `activeKind: 'auto'|'multi'|'none'`, `onChangeTab`, `onSelectCandidate`, `onManualMatch`, `onExcludeTx?`
- **State**: `selectedRowId`
- **토큰**: 탭=기존 SegmentedControl (활성 탭 text-primary + 2px Action Blue underline), 행 카드 그림자 0 + hairline, 칩=C-465. 데스크톱 표는 sticky 첫 컬럼(일자).
- **변형**: auto-list / multi-list (⭐ 1순위) / none-list (수동 매칭 CTA)
- **접근성**: 탭 `role="tablist"` + `aria-selected`, 카드 `role="group"`, 데스크톱 표 화살표 키 셀 이동
- **인터랙션**: 탭 전환 120ms fade, "후보→자동" 이동 FLIP 220ms

### C-465 MatchStatusChip — 매칭 상태 칩 3종
- **Props**: `kind: 'auto'|'multi'|'none'`
- **State**: presentational
- **토큰**: radius-pill, padding 4px 10px, sm/600 — auto: primary-500/primary-50, multi: warning/warning-bg, none: text-muted/neutral-bg
- **변형**: (a) default (b) with-count (`자동 118`) — 탭 헤더에서 사용
- **사용처**: SCR-065 전용

> **재사용 결정**: `StatusPill`(C-220 기존)은 회비 상태 전용 — 매칭 도메인과 시각 톤이 달라 별도 컴포넌트 분리.

---

## 5. 마이크로 인터랙션

| 트리거 | 동작 | 시간/토큰 |
|--------|------|-----------|
| 모든 버튼 press | `transform: scale(0.95)` | 120ms `fast` `standard` |
| 시트 등장 | translateY 100%→0 + 배경 dim `rgba(0,0,0,0.35)` | 220ms `emphasized` |
| 시트 제출 후 칩 전환 | 이전 칩 fade-out 120ms → 새 칩 fade-in+6px slide-up 180ms | ≤320ms |
| Toast 등장 | 하단 8px slide-up + opacity 0→1 (4초 자동 dismiss) | 200ms |
| 컨펌 "확인" → 행 제거 | fade-out 180ms + 리스트 reflow FLIP 220ms | 320ms |
| 5초 [실행취소] 토스트 | 카운트다운 후 자동 confirm; 클릭 시 즉시 롤백+행 복원 | 5s |
| 드롭존 hover/dragOver | bg+border 색 전환 | 200ms `standard` |
| 드롭존 파일 인식 | height 200→80px 축소 + 양식명 fade-in | 320ms `emphasized` |
| 매칭 탭 전환 | 컨텐츠 fade 120ms, underline transition-x | 120ms |
| 후보 시트 선택 → 자동매칭 이동 | FLIP 220ms `standard` (사용자에게 위치 이동 인지) | 220ms |
| 일괄 확정 진행 | sticky 버튼 "118건 확정 중…" + 인라인 스피너, 클릭 차단 | — |
| 일괄 확정 완료 | dim → 성공 토스트 → 매트릭스 자동 이동 | 320ms dim, 2s 후 이동 |
| `prefers-reduced-motion: reduce` | 모든 duration 0, transform 없음, fade 즉시 | — |

---

## 6. 접근성 / 모바일 제약

- **터치 타깃 44×44px** 엄수. [반려]/[확인] 각 min-h 44 / min-w 88px, 인접 8px gap. [선택하기 →] text-link 도 hit area 12px 패딩으로 44px 확보.
- **한손 조작**: SCR-051 "입금했어요" CTA는 본문 하단 엄지 영역. 컨펌 액션 버튼은 행 하단 우측. 시트 [신고 제출]은 viewport 하단 sticky.
- **sticky 액션바 (SCR-065)**: BottomTabBar 미노출 sub 페이지 → 56px 없음. padding-bottom: `max(16px, env(safe-area-inset-bottom))`. sticky 높이 = 안내문(20) + 버튼(44) + padding(12×2) = **약 88~96px**. 본문 padding-bottom = sticky+16(약 112px). 키보드 등장 시 `visualViewport` 변화에 맞춰 위로 이동. SCR-064는 행 단위 액션이라 sticky bar 없음.
- **키보드/스크린리더**: 모든 시트·다이얼로그 focus trap, ESC 닫기, 트리거로 복귀. 토스트 `role="status"` + `aria-live="polite"`. 컨펌 행 `aria-label="김지민 회원의 2026-1학기 회비 5만원 신고를 처리하세요"`. 드롭존 input file sr-only + label, 매칭 탭 `role="tab"` + 화살표 네비.
- **한국어/IME**: 메모/사유 입력 IME 조합 중 Enter 자동 제출 금지(`compositionstart/end`). 사유 다이얼로그 카운터 `[...str].length` 한글 정확 카운트. 폰트 17px 본문 (iOS zoom 방지).
- **색 단독 금지**: 모든 상태(`pending`/`rejected`/`paid` 및 `auto/multi/none`)는 **색 + 아이콘 + 한국어 라벨** 3중 표시.

---

## 7. 데이터 폐기 UX (CSV 원본 즉시 폐기)

> PM §6 보안 충족. 사용자가 "원본은 서버 미저장" 을 **5개 지점에서 반복 인지**.

| # | 위치 | 문구 | 스타일 |
|---|------|------|--------|
| 1 | SCR-065 Phase A 드롭존 직하 InfoBanner | "ⓘ 업로드한 파일은 매칭 처리 후 즉시 폐기되며 서버에 저장되지 않습니다." | bg=primary-50, base/400, ⓘ |
| 2 | SCR-065 Phase C sticky bar 상단 캡션 | "ⓘ 파일은 처리 후 폐기됩니다 · 자동매칭 N건만 확정됩니다" | xs/text-secondary |
| 3 | SCR-065-G 가이드 모달 하단 | "⚠ 본 앱은 매칭 후 원본을 즉시 폐기하며, 매칭 로그에는 입금자명·메모·금액만 남깁니다." | sm/warning |
| 4 | 일괄 확정 완료 토스트 | "N건 납부 처리 완료 · 업로드한 파일은 폐기되었습니다." | success toast |
| 5 | 매칭 검토 화면 이탈 가드 ConfirmDialog | "검토를 중단하면 업로드한 파일과 매칭 결과가 폐기됩니다. 계속할까요?" | ghost-danger CTA |

> **Frontend 구현 가이드**: File 객체는 useState로만 관리, unmount 시 `setFile(null)`로 GC. ObjectURL 생성 시 `URL.revokeObjectURL`. 서버 호출 시 파싱된 거래(자동매칭 분만) JSON 전송, 원본 File 전송 금지.

---

## 8. Frontend 인계 노트

### 8.1 재사용 (기존 컴포넌트)
| 기존 | 사용 위치 |
|------|----------|
| AppBar (C-100) | SCR-051/064/065 |
| Button (C-110/111/112) primary/secondary-pill/danger-ghost | 모든 CTA — **신규 variant 불필요** |
| Sheet (C-170) | C-461, 후보 선택 시트 |
| ConfirmDialog (C-171) | SCR-064-D (TextArea 슬롯 추가) / 이탈 가드 |
| Toast (C-180) | 신고/확인/반려/확정 완료 |
| TextField, TextArea (C-101/102) | 시트, 다이얼로그 |
| SegmentedControl (C-140) | SCR-065 3-tab |
| InfoBanner (C-230) | 폐기 안내 |
| EmptyState (C-250) | SCR-064 빈 상태 |
| StatusPill (C-220) | SCR-051 — `pending_payment`/`rejected` tone 매핑 추가만 |

### 8.2 신규 생성 (6개) → `components/dues/`
| 컴포넌트 | 파일 |
|----------|------|
| C-460 BankRuleBanner | `BankRuleBanner.tsx` |
| C-461 PaymentReportSheet | `PaymentReportSheet.tsx` |
| C-462 PaymentApprovalRow | `PaymentApprovalRow.tsx` |
| C-463 TransactionUploadDropzone | `TransactionUploadDropzone.tsx` |
| C-464 TransactionReviewTable | `TransactionReviewTable.tsx` |
| C-465 MatchStatusChip | `MatchStatusChip.tsx` |

### 8.3 토큰 매핑 (`tailwind.config.ts` 변경 불필요)
`bg-primary-50` → BankRuleBanner / MatchStatusChip(auto) · `success/warning/danger/neutral`-bg/fg → StatusPill 매핑 · `rounded-pill` → 모든 CTA + 칩 · `rounded-lg`(18px) → 드롭존/매칭 카드/시트 상단 · `active:scale-95 transition-transform duration-fast ease-standard` → 모든 버튼/칩 · **`shadow-product` 사용 금지** (Apple grammar — 드롭존도 그림자 없이 dashed border).

### 8.4 신규 StatusPill 매핑 (기존 DuesStatusBadge.tsx 확장)
```ts
const TONE: Record<DuesStatus, Tone> = {
  paid: 'success', unpaid: 'danger',
  pending_payment: 'warning',  // 신규
  rejected: 'danger',          // 신규 (사유는 별도 노출)
  exempt: 'neutral', partial: 'warning',
};
const ICONS = { ...기존, pending_payment: '⏳', rejected: '🚫' };
const LABELS = { ...기존, pending_payment: '검토중', rejected: '반려됨' };
```

### 8.5 라우팅 (Next.js App Router)
```
app/(app)/dues/[itemId]/page.tsx                      ◀ SCR-051 (RSC + client 시트)
app/(app)/dues/admin/pending/page.tsx                 ◀ SCR-064 (RSC + client row actions)
app/(app)/dues/admin/transactions/upload/page.tsx     ◀ SCR-065 (client-heavy, 클라 파싱)
app/(app)/dues/admin/transactions/log/page.tsx        ◀ SCR-066 (P2 stub)
```
- SCR-065 Phase A~C는 동일 URL 내 state 전환. 새 파일 업로드 시 state reset.
- SCR-051은 RSC + 시트만 client. 시트 제출 → Server Action → router.refresh().

### 8.6 권한 가드
- `/dues/[itemId]`: dues_payment.user_id == auth.uid 일 때만 "입금했어요" 노출. 임원이 타인 항목 진입 시 CTA 비노출(대리 신고는 흐름 A).
- `/dues/admin/*`: 미들웨어 또는 layout RSC에서 role 체크 (member → SCR-ERR-403).

### 8.7 Backend 협의 필요
1. `dues_payment.reported_at`, `reported_amount_krw`, `rejection_reason` 컬럼명 확정 → 컴포넌트 props 동기화.
2. 매칭 후보 시트 1순위 룰("가장 오래된 미납") → RPC 응답에 `is_recommended: boolean` 포함 권장.
3. 컨펌 행 [실행취소] 5초 패턴 → Backend 멱등성 필요(`paid → pending_payment` 롤백 호출 가능해야).

---

## 산출 요약

- **신규 화면 6** (SCR-051/052/064/064-D/065/065-G) + P2 stub 1 (SCR-066)
- **신규 컴포넌트 6** (C-460 ~ C-465) — 기존 카탈로그와 ID 충돌 없음
- **상태 매핑 추가** — `pending_payment` (warning, ⏳ 검토중) / `rejected` (danger, 🚫 반려됨), StatusPill 확장만
- **데이터 폐기 UX** — 5개 지점 반복 인지
- **Apple grammar 준수** — 단일 Action Blue / pill CTA / scale(0.95) / 카드 그림자 0 / 17px body / 표면 교차 분절
- **Tailwind config 변경 없음** — 기존 토큰으로 모든 시각 표현 가능
