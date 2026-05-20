> ⚠️ 임시 Designer 섹션 — Phase 5에서 통합 예정

# 06. Designer 설계 — 회비 모듈 확장 (입금 신고 + CSV 매칭)

> 작성자: Designer 에이전트
> 작성일: 2026-05-20
> 기반: `_workspace/06_pm.md` v0.1, `_workspace/02_designer_uiux.md` v0.1, `_workspace/external/apple-design-system.md`, `tailwind.config.ts`
> 대상 뷰포트: 모바일 우선 360~414px / 데스크톱 max-width 720px
> 디자인 원칙: Apple grammar 엄수 — 단일 Action Blue(#0066cc), pill CTA, `transform: scale(0.95)` press, **카드 그림자 금지**, 17px body, 표면(surface) 교차로만 분절

## 변경 로그
| 날짜 | 버전 | 변경 |
|------|------|------|
| 2026-05-20 | v0.1 | 회비 모듈 확장 디자인. P0(흐름 C: 입금 신고/컨펌) + P1(흐름 B: CSV 업로드/매칭). 신규 화면 6개, 신규 컴포넌트 6개. |

---

## 1. 신규 화면 목록

> 기존 회비 IA (02_designer_uiux §1.2) 를 **add-only** 로 확장. 라우트 ID는 SCR-051~054 (회원 측 + 임원 P0) / SCR-064~066 (임원 P1) 신설.

### 1.1 Phase 1 — P0 (흐름 C)
| 화면 ID | 라우트 | 진입 경로 | 권한 |
|---------|--------|-----------|------|
| **SCR-051** | `/dues/[itemId]` (회원 측 회비 항목 상세) | SCR-050에서 학기 카드 탭 | 본인 회원 / 임원 / 관리자 |
| **SCR-052** | `/dues/[itemId]` 내 `<PaymentReportSheet>` 시트 | SCR-051에서 "입금했어요" 탭 | 본인 회원만 |
| **SCR-064** | `/dues/admin/pending` (임원 입금 신고 컨펌 목록) | SCR-060 우상단 ⋮ → "입금 신고 컨펌" / 임원 진입 시 SCR-060 상단 알림 배지 → 탭 | 임원 / 관리자 |
| **SCR-064-D** | `<RejectReasonDialog>` (반려 사유 입력) | SCR-064에서 행 "반려" 탭 | 임원 / 관리자 |

### 1.2 Phase 2 — P1 (흐름 B)
| 화면 ID | 라우트 | 진입 경로 | 권한 |
|---------|--------|-----------|------|
| **SCR-065** | `/dues/admin/transactions/upload` (CSV 업로드/매칭) | SCR-060 ⋮ → "거래내역 업로드" | 임원 / 관리자 |
| **SCR-065-G** | `<UploadGuideSheet>` (지원 은행 5종 안내) | SCR-065 상단 "지원 양식 보기" 링크 | 동일 |
| **SCR-066** | `/dues/admin/transactions/log` (매칭 로그, P2 stub) | SCR-065 하단 링크 | 임원 / 관리자 |

### 1.3 진입 IA 변경 (요약)
```
회비 (DUES)
├─ /dues                              [회원] (기존 SCR-050)
│   └─ /dues/[itemId]                 [회원] 회비 항목 상세        ◀ SCR-051 신규
│       └─ 입금 신고 시트                                          ◀ SCR-052 신규
├─ /dues/admin                        [임원] (기존 SCR-060)
│   ├─ /dues/admin/pending            [임원] 입금 신고 컨펌         ◀ SCR-064 신규
│   ├─ /dues/admin/transactions/upload [임원] CSV 업로드/매칭      ◀ SCR-065 신규  (P1)
│   └─ /dues/admin/transactions/log   [임원] 매칭 로그              ◀ SCR-066 (P2 stub)
└─ /dues/admin/items                  [임원] (기존 SCR-061)
```

> **임원 진입 동선**: SCR-060 AppBar 우상단 `⋮` 메뉴를 **3-item action menu**로 확장: ① 항목 관리 (기존) ② **입금 신고 컨펌 (배지 N)** ③ **거래내역 업로드** (P1 활성화 후). pending 신고 ≥ 1건이면 메뉴 아이콘 옆에 작은 점 배지 노출 (`primary-500` 4px dot).

---

## 2. 와이어프레임

> 360~414px 모바일 기준. Apple grammar — 카드 그림자 0, pill CTA, 17px body, 표면 색 교차로 분절.

### SCR-051 회비 항목 상세 (회원) `/dues/[itemId]`
진입: SCR-050 → 학기 카드 탭. 신규.
```
┌────────────────────────────────────┐
│ ← 회비                              │  ← AppBar (back)
├────────────────────────────────────┤
│ 2026-1학기 회비                     │  ← 4xl/600/-0.02em  (display-lg)
│ 50,000원 · 마감 4/30                │  ← lg/400/-0.015em
├────────────────────────────────────┤
│ ┌────────────────────────────────┐ │
│ │ 입금자명을 다음 형식으로 적어주세요│ │
│ │                                  │ │  ← BankRuleBanner (C-460)
│ │   김지민/2026-1학기              │ │     bg = primary-50 (#f5f5f7)
│ │                                  │ │     1px border-default
│ │  [📋 복사하기]                   │ │     본문 base/400
│ │                                  │ │     "복사하기" = text-link
│ │  우리은행 1234-5678-901234      │ │     예금주: 원우회 박현우
│ │                                  │ │
│ └────────────────────────────────┘ │
├────────────────────────────────────┤
│ 내 상태                              │  ← caption-strong
│                                     │
│  ❌ 미납                            │  ← StatusPill (sm) — 색+아이콘+라벨
│                                     │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─       │
│                                     │
│  계좌이체 후 아래 버튼을 눌러주세요   │  ← sm/text-secondary
│                                     │
│  ┌───────────────────────────┐     │
│  │      입금했어요             │     │  ← button-primary (pill)
│  └───────────────────────────┘     │      44px / scale-95 / Action Blue
│                                     │
└────────────────────────────────────┘
```

**상태별 본문 변형 (동일 화면, 상태만 교체):**

`pending_payment` (검토 중):
```
│  ⏳ 검토중                          │  StatusPill (warning, muted amber)
│  5월 20일 14:32 신고 · 50,000원      │  sm/text-secondary
│                                     │
│  [신고 취소]   (P1, US-C04)         │  button-secondary-pill (ghost)
│                                     │  ※ P0에서는 미노출
│  처리되면 알림으로 알려드릴게요.       │  sm/text-secondary
```

`rejected` (반려):
```
│  🚫 반려됨                          │  StatusPill (danger, muted red)
│  사유: "입금자명을 김지민/26-1로     │  base/400 ink — 사유 본문 그대로
│  적어주세요. 김지민XX 로 입금되어    │
│  매칭할 수 없습니다."                │
│  5월 20일 16:10 처리                │  sm/text-secondary
│                                     │
│  ┌───────────────────────────┐     │
│  │   다시 신고하기             │     │  button-primary
│  └───────────────────────────┘     │
```

`paid`:
```
│  ✅ 납부완료                         │  StatusPill (success, muted green)
│  5월 20일 14:00 입금 · 50,000원      │
│  메모: 4/10 입금 (총무 확인)          │  memo_public=true 일 때만
```

`exempt`:
```
│  ⚪ 면제                            │  StatusPill (neutral)
│  메모: 조교 면제 (총무 확인)          │
```

빈 상태 / 에러: 항목 없음 → SCR-050으로 리다이렉트. 네트워크 오류 → C-251 ErrorState.

---

### SCR-052 입금 신고 시트 (회원)
SCR-051에서 "입금했어요" 탭 → BottomSheet 슬라이드 업.
```
┌────────────────────────────────────┐
│ ──                                  │  ← drag handle (4px)
│                                     │
│ 입금 신고                           │  ← xl/600 (24px tagline 한 단계 상위)
│ 2026-1학기 · 50,000원                │  ← sm/text-secondary
├────────────────────────────────────┤
│                                     │
│ 입금 일시 *                         │  ← caption-strong
│ ┌────────────────────────────────┐ │
│ │ 2026.05.20 (수) 14:32     📅  │ │  ← TextField (DateTime), default=now
│ └────────────────────────────────┘ │     pill radius / border-default
│                                     │
│ 금액 *                              │
│ ┌────────────────────────────────┐ │
│ │ 50,000                       원│ │  ← TextField (numeric), default=항목금액
│ └────────────────────────────────┘ │
│ ⚠ 항목 금액(50,000원)과 다릅니다.   │  ← sm/warning (다를 때만 노출)
│   부분/초과 납부로 신고됩니다.        │     아이콘+텍스트 (색 단독 금지)
│                                     │
│ 메모 (선택)                         │
│ ┌────────────────────────────────┐ │
│ │                                │ │  ← TextArea (rows=2, max 200자)
│ │                                │ │
│ └────────────────────────────────┘ │
│                                     │
├────────────────────────────────────┤
│ ┌──────────┐  ┌──────────────────┐ │
│ │ 취소      │  │   신고 제출      │ │  ← 좌:secondary-pill, 우:primary
│ └──────────┘  └──────────────────┘ │     sticky 하단, sab 고려
└────────────────────────────────────┘
```

UX 노트:
- 시트 높이: 키보드 올라온 상태에서도 "신고 제출" 버튼 가시 (`100dvh` 기준 max-height 90%, content scroll).
- 제출 직후: 시트 자동 닫힘 → SCR-051 본문이 `unpaid → pending_payment` 로 부드럽게 전환 (220ms ease-standard, 상태 칩 fade+slide-up 6px).
- Toast: "신고가 접수되었어요. 임원이 확인하면 알림으로 알려드릴게요." (info / 4초).

---

### SCR-064 입금 신고 컨펌 목록 (임원) `/dues/admin/pending`
```
┌────────────────────────────────────┐
│ ← 입금 신고 컨펌          3건 대기  │  ← AppBar (back + 우측 카운트 caption)
├────────────────────────────────────┤
│ 신고 시각이 오래된 순으로 표시됩니다 │  ← xs/text-muted (가이드)
├────────────────────────────────────┤
│ 김지민 · 2026-1학기                │  ← PaymentApprovalRow (C-462)
│ 50,000원 · 5/20 14:32 신고          │     base/600 이름 / sm/text-secondary 메타
│ 메모: 4월 10일 입금 (4월급여로)     │     본문 sm/text-primary
│                                     │
│  ┌─────────┐ ┌──────────────────┐ │
│  │ 반려     │ │ 확인              │ │  ← secondary-pill / primary-pill
│  └─────────┘ └──────────────────┘ │     min-h 44px, 우측 정렬
├────────────────────────────────────┤
│ 이수아 · 2026-1학기                │
│ 30,000원 · 5/20 15:01 신고          │
│ ⚠ 항목 금액(50,000원)과 다름        │  ← warning 캡션 (부분/초과 시 자동)
│                                     │
│  ┌─────────┐ ┌──────────────────┐ │
│  │ 반려     │ │ 확인              │ │
│  └─────────┘ └──────────────────┘ │
├────────────────────────────────────┤
│ 박현우 · 2025-2학기                │
│ ...                                 │
└────────────────────────────────────┘
```

UX 노트:
- 행 사이 구분은 **1px hairline border** 만. 카드 그림자 없음 (Apple grammar).
- "확인" 1탭 → 즉시 행이 fade out 후 제거 + 상단 Toast: "납부 처리 완료 · [실행취소]" (5초). 실행취소 = `paid → pending_payment` 롤백.
- "반려" 탭 → SCR-064-D 다이얼로그.
- 검색/필터: 상단에 검색 입력(C-101) — 회원명/학기 라벨. (P0에서 SectionHeader 한 줄로 단순).

**빈 상태 (SCR-064-Empty):**
```
┌────────────────────────────────────┐
│ ← 입금 신고 컨펌                   │
├────────────────────────────────────┤
│                                     │
│              📭                     │  ← C-250 EmptyState
│                                     │
│   대기 중인 신고가 없습니다           │  ← lg/600
│                                     │
│   회원이 "입금했어요"를 누르면        │  ← sm/text-secondary
│   여기에 표시됩니다.                  │
│                                     │
└────────────────────────────────────┘
```

### SCR-064-D 반려 사유 다이얼로그
```
┌────────────────────────────────────┐
│                                     │
│  김지민님 신고 반려                  │  ← lg/600
│  2026-1학기 · 50,000원               │  ← sm/text-secondary
│                                     │
│  사유 * (회원에게 표시됩니다)         │  ← caption-strong
│  ┌────────────────────────────────┐│
│  │                                ││  ← TextArea (rows=3, 1~200자)
│  │                                ││     필수
│  └────────────────────────────────┘│
│  0 / 200                            │  ← xs/text-muted (우측 정렬)
│                                     │
│  ┌──────────┐ ┌──────────────────┐ │
│  │ 취소      │ │ 반려             │ │  ← 우:DangerButton (sm:없음, Apple은
│  └──────────┘ └──────────────────┘ │     단일 Action Blue 원칙이라
│                                     │     반려는 `text-danger` 라벨 +
│                                     │     border-danger 인 ghost pill)
└────────────────────────────────────┘
```

> **Apple grammar 적용 메모**: "반려" 버튼은 빨간 fill 이 아닌 **ghost danger pill** (`border-danger` + `text-danger` + 투명 배경 + `rounded-pill`). 단일 Action Blue 원칙을 흐리지 않으면서, 위험 의도는 색+라벨로 동시 표시.

---

### SCR-065 거래내역 업로드 (임원, P1) `/dues/admin/transactions/upload`

**Phase A: 파일 업로드 전**
```
┌────────────────────────────────────┐
│ ← 거래내역 업로드                  │
├────────────────────────────────────┤
│ 지원 은행: KB · 신한 · 우리 · 카카오 │
│ · 토스        [지원 양식 자세히 →]  │  ← text-link (Action Blue)
├────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐ │
│  │                              │ │
│  │           ⬆                   │ │  ← TransactionUploadDropzone
│  │                              │ │     (C-463)
│  │   CSV/XLSX 파일을 끌어다      │ │     bg = bg-subtle (#fafafc)
│  │   놓거나 눌러서 선택하세요    │ │     border = 2px dashed border
│  │                              │ │     rounded-lg (18px)
│  │   최대 2MB · 1,000행 이하     │ │     padding 48px
│  │                              │ │     min-h 200px
│  └──────────────────────────────┘ │
│                                     │
│  ⓘ 업로드한 파일은 매칭 처리 후      │  ← InfoBanner — 파일 폐기 안내
│    즉시 폐기되며 서버에 저장되지     │     bg = primary-50 / icon ⓘ
│    않습니다.                         │     base/400 (강조)
│                                     │
└────────────────────────────────────┘
```

**Phase B: 파일 인식 직후 (감지 결과)**
```
│ ...드롭존이 작은 상태로 축소...     │
│                                     │
│  ✅ 신한은행 양식으로 인식됨         │  ← StatusPill (success) inline
│  📄 transactions_05.csv · 142건     │  ← base/400 + xs/muted
│  [다른 파일 선택]                   │  ← text-link
```

**Phase C: 매칭 결과 검토 (메인)**
```
┌────────────────────────────────────┐
│ ← 거래내역 업로드                   │
├────────────────────────────────────┤
│ 신한은행 · 142건                    │  ← sm/text-secondary
│                                     │
│  ✅ 자동매칭  118건                 │  ← SegmentedControl (3-tab)
│  ⚠ 후보 다수   18건                 │     각 탭에 카운트 배지
│  ❌ 미매칭     6건                  │
│  ─────────────────────              │  현재 탭 1px Action Blue underline
├────────────────────────────────────┤
│ (모바일: 카드 리스트 / 데스크톱: 표) │
│                                     │
│ ┌────────────────────────────────┐ │
│ │ 5/18 14:22                     │ │  ← TransactionReviewTable row
│ │ 김지민 · 50,000원               │ │     (C-464)
│ │ 메모: 김지민/26-1               │ │
│ │ ─────────────────              │ │     1px hairline
│ │ → 김지민 · 2026-1학기 회비       │ │     매칭된 회원·항목 (base/600)
│ │   [자동] MatchStatusChip(primary)│ │     ← C-465
│ └────────────────────────────────┘ │
│                                     │
│ ┌────────────────────────────────┐ │
│ │ 5/18 15:01                     │ │
│ │ 이수아 · 50,000원               │ │
│ │ 메모: 이수아                     │ │
│ │ ─────────────────              │ │
│ │ → 후보 3건                       │ │
│ │   [후보] MatchStatusChip(warning)│ │
│ │   [선택하기 →]  text-link       │ │  ← 탭 → 후보 시트 (US-B03)
│ └────────────────────────────────┘ │
│                                     │
│ ❌ 미매칭 탭:                       │
│ ┌────────────────────────────────┐ │
│ │ 5/18 16:30                     │ │
│ │ ㄱㄴㄷ · 100,000원               │ │
│ │ 메모: (없음)                    │ │
│ │   [미매칭] MatchStatusChip(muted)│ │
│ │   [수동 매칭 →]                 │ │
│ └────────────────────────────────┘ │
├────────────────────────────────────┤
│ ─ sticky bottom action bar ─       │
│ ┌────────────────────────────────┐ │
│ │ 자동매칭 118건만 확정됩니다       │ │  ← xs/text-secondary
│ │ ⓘ 파일은 처리 후 폐기됩니다       │ │
│ │ ┌────────┐ ┌─────────────────┐ │ │
│ │ │ 폐기    │ │ 118건 일괄 확정  │ │ │  ← danger ghost / primary pill
│ │ └────────┘ └─────────────────┘ │ │
│ └────────────────────────────────┘ │  bg = canvas-parchment 80% + blur
└────────────────────────────────────┘  z=bottomBar, sab 고려
```

**후보 다수 선택 시트 (US-B03):**
```
┌────────────────────────────────────┐
│ ── 거래 매칭                        │
│ 이수아 · 50,000원 · 5/18 15:01     │
├────────────────────────────────────┤
│ 후보 회원/회비 항목                  │
│                                     │
│ ┌────────────────────────────────┐ │
│ │ ⭐ 이수아 (24학번) · 2025-2학기 │ │  ← 가장 오래된 미납 (1순위 강조)
│ │    50,000원 미납 · 추천          │ │     border = 2px primary-focus
│ │    [라디오: 선택됨 ●]            │ │
│ └────────────────────────────────┘ │
│ ┌────────────────────────────────┐ │
│ │ 이수아 (24학번) · 2026-1학기    │ │
│ │ 50,000원 미납                    │ │
│ │ [라디오: ○]                      │ │
│ └────────────────────────────────┘ │
│ ┌────────────────────────────────┐ │
│ │ 이수아 (22학번 졸업, 동명이인)   │ │
│ │ ⚠ 미납 없음                     │ │
│ │ [라디오: ○]                      │ │
│ └────────────────────────────────┘ │
├────────────────────────────────────┤
│ ┌──────────┐ ┌──────────────────┐ │
│ │ 취소     │ │ 자동매칭으로 이동 │ │
│ └──────────┘ └──────────────────┘ │
└────────────────────────────────────┘
```

### SCR-065-G 업로드 가이드 모달
```
┌────────────────────────────────────┐
│ ── 지원 은행 양식                   │
├────────────────────────────────────┤
│ 다음 5개 은행의 거래내역 CSV/XLSX   │
│ 파일을 자동으로 인식합니다.          │
│                                     │
│  • KB국민은행 — 인터넷뱅킹 거래내역   │
│  • 신한은행   — SOL 거래내역 CSV     │
│  • 우리은행   — 거래내역 조회 엑셀    │
│  • 카카오뱅크 — 거래내역 CSV         │
│  • 토스뱅크   — 거래내역 엑셀        │
│                                     │
│ 다른 은행도 헤더(일자/입금자명/금액/ │
│ 메모) 컬럼이 포함되면 수동 매핑으로  │
│ 처리할 수 있습니다.                  │
│                                     │
│ ⚠ 파일에는 회원 개인정보가 포함되어  │
│   있을 수 있습니다. 본 앱은 매칭 후  │
│   원본을 즉시 폐기하며, 매칭 로그에   │
│   는 입금자명·메모·금액만 남깁니다.  │
│                                     │
│         [닫기]                      │
└────────────────────────────────────┘
```

---

## 3. 상태별 표시 매트릭스

> 회비 항목 상태(`dues_payment.status`) × 화면별 시각 표현. 색·아이콘·라벨을 **반드시 함께** 노출 (접근성: 색 단독 금지).

| 상태 | 토큰 (fg/bg) | 아이콘 | 라벨 | SCR-050 회원 카드 | SCR-051 상세 | SCR-060 임원 매트릭스 | SCR-064 컨펌 목록 |
|------|--------------|--------|------|-------------------|--------------|----------------------|-------------------|
| `unpaid` | `danger` / `danger-bg` | ❌ | 미납 | 카드에 표시 | 본문 + "입금했어요" CTA 노출 | 행 표시 | — |
| `pending_payment` | `warning` / `warning-bg` | ⏳ | 검토중 | 카드 우상단 칩 + 신고시각 sm | 본문 + 신고 메타 (취소 P1) | 행에 칩 표시 | **목록 1행** |
| `paid` | `success` / `success-bg` | ✅ | 납부완료 | 카드에 표시 | 본문 + 입금시각/메모 | 행 표시 | — (목록에서 제거) |
| `rejected` | `danger` / `danger-bg` | 🚫 | 반려됨 | 카드 + 사유 한 줄 truncate | 본문 + 사유 전문 + "다시 신고" CTA | 행에 칩 | — (반려는 즉시 회원에게 알림 후 자동 `unpaid` 복귀) |
| `exempt` | `text-secondary` / `neutral-bg` | ⚪ | 면제 | 카드 표시 | 본문 + 메모 | 행 표시 | — |
| `partial` | `warning` / `warning-bg` | 🟡 | 부분납부 | 카드 표시 | 본문 + 신고/실수령 금액 | 행 표시 | — (확정된 행은 컨펌 목록 X) |

**매칭 상태(`dues_match_candidate.kind`) — SCR-065 전용:**
| kind | 토큰 | 라벨 | 액션 가능성 |
|------|------|------|------------|
| `auto` | `primary-500` / `primary-50` | 자동 | 일괄 확정 대상 |
| `multi` | `warning` / `warning-bg` | 후보 | 시트에서 1개 선택 → `auto` 전환 |
| `none` | `text-muted` / `neutral-bg` | 미매칭 | 수동 매칭 또는 제외 |

---

## 4. 신규 컴포넌트 카탈로그

> ID 안정 유지. 02_designer_uiux §4 의 카테고리 체계(C-1xx ~ C-5xx) 를 따른다. 회비 도메인이므로 **C-46x 신규 슬롯** 사용 (기존 C-401/410/420/421/430/440/450 와 충돌 없음).

### C-460 BankRuleBanner (입금자명 규칙 안내)
| 항목 | 값 |
|------|-----|
| **목적** | SCR-051 상단에 "{이름}/{학기라벨}" 입금자명 예시를 노출. 복사 버튼 제공. US-C02. |
| **Props** | `memberName: string` · `termLabel: string` · `bankInfo: { bank: string, account: string, owner: string }` · `onCopy?: () => void` |
| **State** | `copied: boolean` (2초 동안 "복사됨 ✓") |
| **사용 토큰** | bg=`primary-50` (#f5f5f7) · border=`border-default` (1px) · radius=`lg` (18px) · padding=`spacing.6` (24px) · 본문=`base` (17px) · 예시값=`lg/600` (21px) · "복사하기"=`text-link` (Action Blue) |
| **변형** | (1) `default` — 항목 정상, (2) `compact` — 본문 보단 SCR-050 카드 내 inline 미니 버전 (P1 검토) |
| **접근성** | 복사 버튼 `aria-label="입금자명 예시 복사"`. `aria-live="polite"` 영역에서 "복사되었습니다" 알림. |

### C-461 PaymentReportSheet (회원 입금 신고 시트, SCR-052)
| 항목 | 값 |
|------|-----|
| **목적** | 회원이 입금 일시/금액/메모를 확인·수정 후 신고 제출. |
| **Props** | `open: boolean` · `itemId: uuid` · `defaultAmount: number` · `onClose: () => void` · `onSubmitted: (reportId) => void` |
| **State** | `paidAt: Date (default=now)` · `amount: number (default=defaultAmount)` · `memo: string` · `submitting: boolean` · `amountDiffWarning: boolean` |
| **사용 토큰** | Sheet container=`bg-surface` + `radius-lg` 상단 16/16, 하단 0 · 입력=`TextField` 기존 · 경고=`warning fg/bg` · CTA=`button-primary` pill 44px · sab=`env(safe-area-inset-bottom)` |
| **변형** | 신규 신고 / 재신고 (rejected 상태에서 진입 시 상단에 "이전 사유: …" 회색 박스) |
| **접근성** | 시트 열림 시 첫 입력 필드 포커스, ESC=닫기, focus trap, 숫자 입력=`inputmode="numeric"`. |
| **인터랙션** | 제출 → 시트 슬라이드 다운(220ms) + 상태칩 fade·6px slide-up. |

### C-462 PaymentApprovalRow (임원 컨펌 1행, SCR-064)
| 항목 | 값 |
|------|-----|
| **목적** | 신고 1건을 1행으로 표시. 우측 [반려] [확인] 액션. |
| **Props** | `report: { memberName, cohort, termLabel, amount, reportedAt, memo, amountMismatch: boolean }` · `onApprove: () => void` · `onReject: () => void` |
| **State** | `processing: boolean` (확정/반려 처리 중 행 dim + 스피너 12px) |
| **사용 토큰** | row container=padding `spacing.4` (16px) · 1px `border-default` bottom · 이름=`base/600` · 메타=`sm/text-secondary` · 경고=`warning` 아이콘+텍스트 · 버튼 영역 우측 정렬, 8px gap · 둘 다 min-h 44px |
| **변형** | (a) 기본 (b) 금액 불일치 경고 노출 (c) 처리 중 disabled |
| **접근성** | 행 전체 `role="group"`, 라벨=`aria-label="김지민 2026-1학기 5만원 신고. 확인 또는 반려하세요"`. "확인" 직후 `aria-live="polite"` 토스트. |
| **인터랙션** | 확인 1탭 → 220ms fade out → 행 제거. 5초 [실행취소] 토스트. |

### C-463 TransactionUploadDropzone (파일 드롭존, SCR-065)
| 항목 | 값 |
|------|-----|
| **목적** | CSV/XLSX 파일을 드래그&드롭 또는 클릭 업로드. 파일 검증 → 양식 자동 감지. |
| **Props** | `accept: string[]` (.csv, .xlsx) · `maxSizeBytes: number` (2MB) · `maxRows: number` (1000) · `onFile: (file: File) => void` · `disabled?: boolean` |
| **State** | `dragOver: boolean` · `error: string \| null` · `file: File \| null` · `detecting: boolean` |
| **사용 토큰** | bg=`bg-subtle` (#fafafc) → dragOver 시 `primary-50` · 2px dashed `border-default` → dragOver 시 `primary-500` solid · radius=`lg` · padding=`48px` · min-h `200px` · 아이콘=`text-muted` 큰 사이즈 (32px) · 에러=`danger` fg+아이콘 |
| **변형** | (a) idle (b) dragOver (c) detecting (스피너) (d) detected (축소 + 양식명 노출) (e) error |
| **접근성** | input[type=file] 시각 hidden + label로 연결. 키보드 Enter/Space=파일 다이얼로그. 에러는 `role="alert"`. |
| **인터랙션** | dragOver 시 220ms ease-standard로 border 색 전환. 클릭 시 scale-95. |

### C-464 TransactionReviewTable (매칭 결과 카드/표, SCR-065 Phase C)
| 항목 | 값 |
|------|-----|
| **목적** | 파싱된 거래 N건을 3개 탭(자동/후보/미매칭)으로 그룹화하여 표시. 모바일=세로 카드 리스트, 데스크톱=가로 표. |
| **Props** | `transactions: Tx[]` · `activeKind: 'auto'|'multi'|'none'` · `onChangeTab: (k) => void` · `onSelectCandidate: (txId) => void` (multi 행 탭 시 시트 열기) · `onManualMatch: (txId) => void` (none 행) · `onExcludeTx?: (txId) => void` |
| **State** | `selectedRowId: string \| null` |
| **사용 토큰** | 탭 = `SegmentedControl` 기존(C-140) — Apple grammar: 활성 탭만 `text-primary` + 2px Action Blue underline · 행 카드 = `Card` 그림자 0, hairline 구분 · 매칭상태 칩 = C-465 · 표(데스크톱) sticky 첫 컬럼 (일자) |
| **변형** | (a) auto-list (b) multi-list — 추천 1순위에 ⭐ 표시 (c) none-list — "수동 매칭" CTA |
| **접근성** | 탭 = `role="tablist"` / 각 탭 `aria-selected`. 카드 = `role="group"` + 한 줄 요약 aria-label. 데스크톱 표는 키보드 화살표로 셀 이동. |
| **인터랙션** | 탭 전환 fade 120ms · 행 탭 scale-95 · "후보→자동" 이동은 220ms list re-flow (FLIP). |

### C-465 MatchStatusChip (매칭상태 칩 3종)
| 항목 | 값 |
|------|-----|
| **목적** | 거래 매칭 상태를 한 단어 칩으로 시각화. |
| **Props** | `kind: 'auto' \| 'multi' \| 'none'` |
| **State** | - (presentational) |
| **사용 토큰** | radius=`pill` · padding `4px 10px` · `sm/600` (14px) · auto: fg=`primary-500`/bg=`primary-50` · multi: fg=`warning`/bg=`warning-bg` · none: fg=`text-muted`/bg=`neutral-bg` |
| **변형** | (a) default (b) with-count (`자동 118`) — 탭 헤더에서 사용 |
| **접근성** | 단순 칩이지만 의미가 색에 강하게 의존하므로 텍스트 라벨 필수. 스크린리더 그대로 읽힘. |
| **사용처** | SCR-065 (행 칩 + 탭 카운트). 다른 화면에서는 직접 사용 금지(매칭 도메인 한정). |

> **재사용 결정**: `StatusPill` (C-220, 기존) 는 회비 상태(✅❌⚪) 전용 — 매칭 도메인과 시각 톤이 달라 `MatchStatusChip`을 별도로 신설. 둘 다 pill 형이지만 카운트 표시 / 색 매핑이 달라 컴포넌트 분리가 명확.

---

## 5. 마이크로 인터랙션

| 트리거 | 동작 | 토큰 / 시간 |
|--------|------|------------|
| 모든 버튼 press | `transform: scale(0.95)` | duration=`fast` (120ms), easing=`standard` |
| "입금했어요" 탭 → 시트 등장 | 시트 슬라이드 업 (translateY 100%→0) + 배경 dim | 220ms `emphasized`, dim=`rgba(0,0,0,0.35)` |
| 시트 제출 후 SCR-051 칩 전환 | 이전 칩 fade-out(120ms) → 새 칩 fade-in + 6px slide-up(180ms) | total ≤ 320ms |
| Toast 등장 | 하단에서 8px slide-up + opacity 0→1 (4초 후 자동 dismiss + 역방향) | 200ms 표준 |
| 컨펌 "확인" 1탭 → 행 제거 | 행 fade-out(180ms) + 리스트 reflow(220ms, FLIP) | 합 320ms |
| 컨펌 토스트 [실행취소] | 5초 카운트다운 후 자동 confirm; 클릭 시 즉시 롤백 + 행 재등장(reverse 동일 timing) | - |
| 드롭존 hover/dragOver | bg `bg-subtle → primary-50` + border `dashed border → solid primary-500` | 200ms `standard` |
| 드롭존 파일 인식 직후 | 드롭존 height 200→80px 축소, "✅ 신한은행 양식" 영역 fade-in | 320ms `emphasized` |
| 매칭 탭 전환 | 컨텐츠 영역 fade 120ms, 탭 underline은 transition-x | 120ms |
| 후보 시트에서 선택 → 자동매칭으로 이동 | FLIP 애니메이션 (220ms ease-standard) | 사용자에게 "어디로 갔는지" 시각 인지 |
| 매칭 일괄 확정 진행 | sticky bar 우측 버튼이 "118건 확정 중…" + 인라인 스피너로 변경, 클릭 차단 | - |
| 매칭 일괄 확정 완료 | 전체 화면 dim → 성공 토스트 "118건 납부 처리 완료" → 홈/관리 매트릭스로 이동(2초 후 자동) | 320ms dim |
| `prefers-reduced-motion: reduce` | 모든 duration 0, transform 없음, fade 만 즉시 | - |

---

## 6. 접근성 / 모바일 제약

### 6.1 터치 타깃 (02_designer §7.1 상속)
- 모든 인터랙티브 요소 최소 **44×44px**. 컨펌 목록의 [반려]/[확인] 버튼은 각각 min-h 44 / min-w 88px 보장.
- 인접 버튼 간 최소 **8px gap**.
- 매칭 결과 카드의 [선택하기 →] / [수동 매칭 →] 텍스트 링크는 hit area 패딩을 12px 부여하여 44px 확보.

### 6.2 한손 조작
- "입금했어요" 주 CTA는 **SCR-051 본문 하단에 배치** (엄지 영역). 헤더 우상단에 두지 않음.
- 컨펌 목록의 액션 버튼은 **행 하단 우측 정렬** — 한 손으로 오른쪽 엄지로 즉시 누를 수 있도록 (왼손잡이 고려해 화면 폭 60% 이상까지 늘리지 않고 우측 정렬 유지).
- 시트(C-461) 의 [신고 제출] 버튼은 항상 **viewport 하단** 에 sticky.

### 6.3 sticky 액션바 위치 (SCR-065)
- BottomTabBar 미노출 화면(SCR-065는 임원 진입 후 sub 페이지) → BottomTabBar 56px 없음.
- 그러나 iOS sab(safe-area-inset-bottom) 존재 → sticky bar padding-bottom: `max(16px, env(safe-area-inset-bottom))`.
- sticky bar 높이: 안내문 1줄(20px) + 버튼 44px + padding 12*2 = **88~96px**.
- 카드 영역 하단 padding-bottom = sticky bar height + 16px (= 약 112px). 키보드 등장 시 sticky bar는 `visualViewport` 변화에 맞춰 위로 이동.
- BottomTabBar 가 있는 SCR-064(임원 컨펌)에서는 sticky 액션바 없음 — 행 단위 액션이므로.

### 6.4 키보드 / 스크린리더
- 모든 시트(C-461, 후보 선택, SCR-064-D 다이얼로그)는 **focus trap** 적용, ESC=닫기, 닫힌 후 트리거 버튼으로 포커스 복귀.
- 신고 제출 / 컨펌 / 반려 처리 직후의 토스트는 `role="status"` + `aria-live="polite"`.
- 컨펌 행에 `aria-label="김지민 회원의 2026-1학기 회비 50,000원 신고를 처리하세요. 확인 또는 반려 버튼."`.
- 드롭존: `<input type="file">` 은 `sr-only` 로 숨기되 label로 연결, 키보드 포커스 가능.
- 매칭 탭: `role="tab"` + `aria-selected` + 화살표 키 네비게이션.

### 6.5 한국어 / IME
- 메모/사유 입력은 IME 조합 중 Enter 자동 제출 금지 (compositionstart/end 추적).
- 사유 다이얼로그의 "0/200" 카운터는 한글 글자 단위 정확히 카운트 (`[...str].length` 사용).
- 폰트는 17px 본문 유지 (iOS zoom 방지).

### 6.6 색 단독 금지
- 모든 상태(`pending`, `rejected`, `paid`, 매칭 `auto/multi/none`) 는 **색 + 아이콘 + 한국어 라벨** 3중 표시.
- 다크 모드/고대비 모드 대응은 본 Phase 범위 밖이지만, 토큰이 semantic(`success`/`warning`/`danger`)이라 추후 매핑 가능.

---

## 7. 데이터 폐기 UX (CSV 원본 즉시 폐기 안내)

> PM 비기능 요구사항(§6 보안) 충족. 사용자가 "원본 파일이 서버에 저장되지 않음" 을 **3개 지점에서 반복 인지**하도록 한다.

| # | 노출 위치 | 문구 | 토큰 / 스타일 |
|---|----------|------|--------------|
| 1 | **SCR-065 Phase A (업로드 전)** — 드롭존 직하 InfoBanner | "ⓘ 업로드한 파일은 매칭 처리 후 즉시 폐기되며 서버에 저장되지 않습니다." | bg=`primary-50` · base/400 · 아이콘 ⓘ |
| 2 | **SCR-065 Phase C sticky bar 상단** — 한 줄 캡션 | "ⓘ 파일은 처리 후 폐기됩니다 · 자동매칭 N건만 확정됩니다" | xs/text-secondary · 아이콘 ⓘ |
| 3 | **SCR-065-G 업로드 가이드 모달 하단** | "⚠ 본 앱은 매칭 후 원본을 즉시 폐기하며, 매칭 로그에는 입금자명·메모·금액만 남깁니다." | sm/warning fg · 아이콘 ⚠ |
| 4 | **일괄 확정 완료 토스트** | "118건 납부 처리 완료 · 업로드한 파일은 폐기되었습니다." | success toast · 4초 |
| 5 | **이탈 가드** — 매칭 검토 화면에서 페이지 이탈 시도 | ConfirmDialog: "검토를 중단하면 업로드한 파일과 매칭 결과가 폐기됩니다. 계속할까요?" | danger ghost CTA |

> **구현 가이드(Frontend 인계)**: File 객체는 useState 로만 관리, 컴포넌트 unmount 시 `setFile(null)` 로 GC 유도. ObjectURL 생성 시 `URL.revokeObjectURL` 호출. Edge Function 호출 시 파싱된 거래(매칭 후 자동매칭만) 만 JSON 으로 전송 — 원본 File 전송 금지.

---

## 8. Frontend 인계 노트

### 8.1 재사용 (기존 컴포넌트 그대로)
| 기존 | 사용 위치 |
|------|----------|
| `AppBar` (C-100) | SCR-051, 064, 065 모두 |
| `Button` (C-110/111/112) — primary / secondary-pill / danger-ghost | 모든 CTA. **신규 variant 불필요** (기존 grammar 충분) |
| `Sheet` (C-170) | C-461 PaymentReportSheet, 후보 선택 시트 |
| `ConfirmDialog` (C-171) | SCR-064-D 반려 다이얼로그 (TextArea 슬롯 추가 필요) / SCR-065 이탈 가드 |
| `Toast` (C-180) | 신고 접수 / 확인 / 반려 / 일괄 확정 완료 |
| `TextField`, `TextArea` (C-101/102) | 신고 시트, 사유 다이얼로그 |
| `SegmentedControl` (C-140) | SCR-065 3-tab |
| `InfoBanner` (C-230) | SCR-065 폐기 안내 |
| `EmptyState` (C-250) | SCR-064 빈 상태 |
| `StatusPill` (C-220) | SCR-051 상태 표시 (`pending_payment` `rejected` 신규 tone 매핑만 추가) |

### 8.2 신규 생성 (6개)
| 컴포넌트 | 경로 (제안) |
|----------|------------|
| C-460 BankRuleBanner | `components/dues/BankRuleBanner.tsx` |
| C-461 PaymentReportSheet | `components/dues/PaymentReportSheet.tsx` |
| C-462 PaymentApprovalRow | `components/dues/PaymentApprovalRow.tsx` |
| C-463 TransactionUploadDropzone | `components/dues/TransactionUploadDropzone.tsx` |
| C-464 TransactionReviewTable | `components/dues/TransactionReviewTable.tsx` |
| C-465 MatchStatusChip | `components/dues/MatchStatusChip.tsx` |

### 8.3 토큰 매핑 (tailwind.config.ts 변경 불필요)
- `bg-primary-50` (#f5f5f7) → BankRuleBanner / MatchStatusChip(auto) 배경
- `bg-success-bg` `text-success` → StatusPill(paid)
- `bg-warning-bg` `text-warning` → StatusPill(pending_payment, partial) + MatchStatusChip(multi)
- `bg-danger-bg` `text-danger` → StatusPill(rejected, unpaid)
- `bg-neutral-bg` `text-text-muted` → StatusPill(exempt) + MatchStatusChip(none)
- `rounded-pill` → 모든 CTA + 칩
- `rounded-lg` (18px) → 드롭존, 매칭 카드, 시트 상단
- `active:scale-95` `transition-transform duration-fast ease-standard` → 모든 버튼/칩 press
- `shadow-product` — **사용 안 함** (Apple grammar: 카드 그림자 0). 드롭존도 그림자 없이 dashed border 로만 표현.

### 8.4 신규 StatusPill tone 매핑 (Frontend 작은 수정)
```ts
// components/dues/DuesStatusBadge.tsx — 이미 존재. 신규 tone 추가.
const TONE: Record<DuesStatus, Tone> = {
  paid: 'success',
  unpaid: 'danger',
  pending_payment: 'warning',   // 신규
  rejected: 'danger',           // 신규 (사유 별도 표시)
  exempt: 'neutral',
  partial: 'warning',
};
const ICONS: Record<DuesStatus, string> = {
  // ...기존
  pending_payment: '⏳',
  rejected: '🚫',
};
const LABELS: Record<DuesStatus, string> = {
  pending_payment: '검토중',
  rejected: '반려됨',
  // ...기존
};
```

### 8.5 라우팅 (Next.js App Router)
```
app/(app)/dues/[itemId]/page.tsx               ◀ SCR-051 (RSC, 시트는 client component)
app/(app)/dues/admin/pending/page.tsx          ◀ SCR-064 (RSC + client row actions)
app/(app)/dues/admin/transactions/upload/page.tsx  ◀ SCR-065 (client-heavy, 파싱 클라이언트)
app/(app)/dues/admin/transactions/log/page.tsx     ◀ SCR-066 P2 (stub)
```
- SCR-065 Phase A~C 는 모두 동일 라우트 내에서 단계 전환 (URL은 안 바뀜). 새 파일 업로드 시 React state reset.
- SCR-051 회원 측은 RSC + 시트만 client. 시트 제출 → Server Action → router.refresh().

### 8.6 권한 가드
- `/dues/[itemId]` 의 본인 행: dues_payment.user_id == auth.uid 일 때만 "입금했어요" 노출. 임원이 다른 회원 항목 진입 시는 이 CTA 비노출 (대리 신고는 흐름 A로).
- `/dues/admin/*` 진입은 미들웨어 또는 layout RSC에서 role check (member 면 SCR-ERR-403).

### 8.7 미해결 (Backend 협의 사항)
1. `dues_payment.reported_at`, `reported_amount_krw`, `rejection_reason` 컬럼 — Designer 화면에 모두 노출 필요. Backend가 컬럼명 확정 시 컴포넌트 props 명명 동기화.
2. 매칭 후보 시트(US-B03)의 "추천 1순위" 룰 — "가장 오래된 미납" 기준. Backend RPC 응답에 `is_recommended: boolean` 포함 권장 (클라이언트 정렬 회피).
3. 컨펌 행의 "실행취소" 5초 윈도우 — 클라이언트 setTimeout + 옵티미스틱 업데이트 패턴. Backend 멱등성 필요 (`paid → pending_payment` 롤백 호출 가능해야).

---

## 산출 요약

- **신규 화면 수**: 6개 (SCR-051, 052, 064, 064-D, 065, 065-G) + 1 stub (SCR-066)
- **신규 컴포넌트 수**: 6개 (C-460 ~ C-465). 기존 카탈로그(02_designer §4) 와 ID 충돌 없음
- **상태 매핑 추가**: `pending_payment` (warning, ⏳ 검토중) / `rejected` (danger, 🚫 반려됨) — `StatusPill` 매핑만 확장
- **데이터 폐기 UX**: 5개 지점에서 반복 인지
- **Apple grammar 준수**: 단일 Action Blue / pill CTA / scale(0.95) / 카드 그림자 0 / 17px body / 표면 교차 분절 — 모든 신규 컴포넌트 적용
- **Tailwind config 변경 없음** — 기존 토큰으로 모든 시각 표현 충족
