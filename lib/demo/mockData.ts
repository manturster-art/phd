// =====================================================================
// lib/demo/mockData.ts
// 데모(/demo/*) 라우트에서 사용하는 mock 데이터.
// Supabase 없이도 프로토타입 화면을 렌더링할 수 있도록 실제 API 타입과
// 호환되는 객체를 제공한다. 기준 시각은 2026-05-20 (UTC) 으로 가정.
//
// 모든 데이터는 정적이며 빌드 타임에 결정된다. 시간 표현은 ISO 문자열로
// 두고, "X분 전 / X시간 전 / X일 전" 같은 상대표현은 lib/utils/format 의
// formatRelative 가 알아서 처리한다.
// =====================================================================

import type { NoticeListItem, NoticeDetail } from '@/lib/api/notices';
import type {
  PostListItem,
  PostDetail,
  CommentItem,
} from '@/lib/api/posts';
import type { Event } from '@/lib/api/events';
import type {
  DuesTermItem,
  MyDuesRow,
  DuesMatrixRow,
} from '@/lib/api/dues';
import type { PendingMember } from '@/lib/api/members';
import type { Profile } from '@/lib/types/database';

// 기준 시각 — 2026-05-20 화요일 10:00 KST.
// 데모 화면에서 "방금 전" / "X시간 전" / "어제" 가 자연스럽게 보이도록
// 모든 created_at 을 이 시각으로부터 역산해 결정한다.
// (Node 의 Date 는 brower/SSR 모두 같은 epoch 를 쓰므로 그대로 사용)
const NOW = new Date('2026-05-20T01:00:00.000Z'); // 10:00 KST

function ago(ms: number): string {
  return new Date(NOW.getTime() - ms).toISOString();
}
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// ------------------------------------------------------------
// 데모 회원 (프로필) — 임원 1 + 일반회원 4
// ------------------------------------------------------------
export interface DemoMember {
  id: string;
  name: string;
  email: string;
  student_id: string;
  cohort_year: number;
  lab: string;
  phone: string;
  role: 'member' | 'officer' | 'admin';
}

export const demoMembers: DemoMember[] = [
  {
    id: 'u-current',
    name: '김지민',
    email: 'jimin.kim@dept.ac.kr',
    student_id: '2026123456',
    cohort_year: 2026,
    lab: '인공지능 연구실',
    phone: '010-1234-5678',
    role: 'member',
  },
  {
    id: 'u-officer',
    name: '박현우',
    email: 'hyunwoo.park@dept.ac.kr',
    student_id: '2023765432',
    cohort_year: 2023,
    lab: '데이터마이닝 연구실',
    phone: '010-2345-6789',
    role: 'officer',
  },
  {
    id: 'u-sua',
    name: '이수아',
    email: 'sua.lee@dept.ac.kr',
    student_id: '2024345678',
    cohort_year: 2024,
    lab: '컴퓨터비전 연구실',
    phone: '010-3456-7890',
    role: 'member',
  },
  {
    id: 'u-minjun',
    name: '정민준',
    email: 'minjun.jung@dept.ac.kr',
    student_id: '2025112233',
    cohort_year: 2025,
    lab: '자연어처리 연구실',
    phone: '010-4567-8901',
    role: 'member',
  },
  {
    id: 'u-soeun',
    name: '한소은',
    email: 'soeun.han@dept.ac.kr',
    student_id: '2024998877',
    cohort_year: 2024,
    lab: '로보틱스 연구실',
    phone: '010-5678-9012',
    role: 'member',
  },
];

export const currentDemoMember = demoMembers[0];

// ------------------------------------------------------------
// 공지
// ------------------------------------------------------------
export const demoNotices: NoticeListItem[] = [
  {
    id: 'n-1',
    title: '5월 종강 모임 안내 (5/22 금)',
    body_md:
      '안녕하세요, 총무 박현우입니다.\n\n2026-1학기 종강 모임을 아래와 같이 진행합니다.\n\n- 일시: 2026.05.22 (금) 18:00\n- 장소: 학생회관 3층 라운지\n- 회비: 1인 10,000원 (현장 수금)\n\n참석 여부는 일정 탭의 RSVP로 알려주세요. 많은 참여 부탁드립니다!',
    pinned: true,
    created_at: ago(2 * DAY),
    author: { name: '박현우', role: 'officer' },
  },
  {
    id: 'n-2',
    title: '2026-1학기 회비 납부 안내',
    body_md:
      '2026-1학기 회비(50,000원) 납부 안내드립니다.\n\n- 마감: 2026.04.30 (목)\n- 입금 계좌: 우리은행 1234-5678-901234 (예금주: 원우회 박현우)\n- 입금 시 이름 + 학번 4자리 기재 부탁드립니다.\n\n납부 확인은 회비 탭에서 확인 가능합니다. 누락 시 총무에게 카톡 주세요.',
    pinned: true,
    created_at: ago(5 * DAY),
    author: { name: '박현우', role: 'officer' },
  },
  {
    id: 'n-3',
    title: '대학원 정기 세미나 일정 공유',
    body_md:
      '6월부터 매주 화요일 16:00에 정기 세미나가 진행됩니다.\n첫 주는 신입생 발표, 둘째 주부터는 교수님 초청 강연입니다.',
    pinned: false,
    created_at: ago(7 * DAY),
    author: { name: '박현우', role: 'officer' },
  },
  {
    id: 'n-4',
    title: '연구실 비품 공동구매 신청 받습니다',
    body_md:
      '커피머신 캡슐, A4 용지 등 공동구매 신청을 받습니다.\n게시판에 댓글로 필요 수량 남겨주세요. 마감은 5/27 수.',
    pinned: false,
    created_at: ago(10 * DAY),
    author: { name: '박현우', role: 'officer' },
  },
  {
    id: 'n-5',
    title: '학과 행정실 이전 안내',
    body_md:
      '학과 행정실이 5월 30일부로 신공학관 2층 215호로 이전합니다.\n증명서 발급 등은 신주소로 방문 부탁드립니다.',
    pinned: false,
    created_at: ago(14 * DAY),
    author: { name: '박현우', role: 'officer' },
  },
];

export function getDemoNoticeDetail(id: string): NoticeDetail | null {
  const n = demoNotices.find((x) => x.id === id);
  if (!n) return null;
  return {
    ...n,
    updated_at: n.created_at,
    created_by: 'u-officer',
  };
}

// ------------------------------------------------------------
// 게시판
// ------------------------------------------------------------
export const demoPosts: PostListItem[] = [
  {
    id: 'p-1',
    title: '종강하면 뭐하세요? 같이 영화 보러 가실 분',
    body_md:
      '종강하면 다들 뭐 하시나요?\n저는 시간이 좀 남는데, 혹시 영화 보러 같이 가실 분 계실까요?\n장르는 SF/스릴러 위주 좋아합니다.',
    category: 'general',
    comment_count: 4,
    created_at: ago(2 * HOUR),
    is_hidden: false,
    author: { name: '김지민' },
  },
  {
    id: 'p-2',
    title: '연구실 에어컨 너무 안 추워요... 다른 분들도 그래요?',
    body_md:
      '연구실 에어컨이 약해서 오후만 되면 졸려요. 다른 연구실도 그런가요?\n혹시 추천 서큘레이터 있으시면 공유 부탁드려요.',
    category: 'question',
    comment_count: 7,
    created_at: ago(6 * HOUR),
    is_hidden: false,
    author: { name: '한소은' },
  },
  {
    id: 'p-3',
    title: '오늘 점심 학식 메뉴 정보 공유합니다',
    body_md:
      '오늘 학식 본관 - 김치찜, 동관 - 카레라이스입니다.\n동관 카레가 평이 좋네요. 줄도 짧습니다.',
    category: 'share',
    comment_count: 2,
    created_at: ago(1 * DAY),
    is_hidden: false,
    author: { name: '정민준' },
  },
  {
    id: 'p-4',
    title: '구인 - 학회 보조 인원 1명 모집합니다',
    body_md:
      '6/3 학과 학회 진행 보조 1명 모집합니다.\n점심 제공 + 소정의 활동비 지급.\n관심 있으신 분 댓글 주세요.',
    category: 'recruit',
    comment_count: 1,
    created_at: ago(2 * DAY),
    is_hidden: false,
    author: { name: '이수아' },
  },
  {
    id: 'p-5',
    title: 'PyTorch 2.5 호환 이슈 공유',
    body_md:
      '연구실에서 쓰던 코드가 PyTorch 2.5 업그레이드 후 동작 안 합니다.\n동일 이슈 겪으시는 분 있나요? 우회 방법 공유합니다.',
    category: 'question',
    comment_count: 3,
    created_at: ago(3 * DAY),
    is_hidden: false,
    author: { name: '김지민' },
  },
];

export function getDemoPostDetail(id: string): PostDetail | null {
  const p = demoPosts.find((x) => x.id === id);
  if (!p) return null;
  // PostListItem 의 author 는 {name} 만, PostDetail 은 추가 필드 필요.
  return {
    ...p,
    updated_at: p.created_at,
    created_by: 'u-current',
    author: {
      name: p.author?.name ?? '',
      role: 'member',
      cohort_year: 2026,
    },
  };
}

export const demoComments: CommentItem[] = [
  {
    id: 'c-1',
    body_md: '저도 한가해요! 어떤 영화 보고 싶으세요?',
    parent_id: null,
    created_at: ago(30 * MIN),
    created_by: 'u-sua',
    author: { name: '이수아' },
  },
  {
    id: 'c-2',
    body_md: '저는 SF 좋아합니다. 메가박스 강남 어떠세요?',
    parent_id: null,
    created_at: ago(20 * MIN),
    created_by: 'u-minjun',
    author: { name: '정민준' },
  },
  {
    id: 'c-3',
    body_md: '오 좋아요! 금요일 저녁 ok 입니다.',
    parent_id: null,
    created_at: ago(10 * MIN),
    created_by: 'u-current',
    author: { name: '김지민' },
  },
  {
    id: 'c-4',
    body_md: '저도 끼워주세요 ㅎㅎ',
    parent_id: null,
    created_at: ago(5 * MIN),
    created_by: 'u-soeun',
    author: { name: '한소은' },
  },
];

// ------------------------------------------------------------
// 일정
// ------------------------------------------------------------
export const demoEvents: Event[] = [
  {
    id: 'e-1',
    title: '종강 파티',
    description_md: '2026-1학기 종강 기념 모임입니다.\n간단한 다과와 함께 진행됩니다.',
    location: '학생회관 3층 라운지',
    starts_at: '2026-05-22T09:00:00.000Z', // 18:00 KST
    ends_at: '2026-05-22T13:00:00.000Z',
    is_all_day: false,
    created_by: 'u-officer',
    created_at: ago(7 * DAY),
    updated_at: ago(7 * DAY),
    deleted_at: null,
  },
  {
    id: 'e-2',
    title: '정기 세미나 — 신입생 발표',
    description_md: '신입생 5명의 연구 주제 소개. 각 10분 발표 + 5분 Q&A.',
    location: '신공학관 304호',
    starts_at: '2026-06-02T07:00:00.000Z', // 16:00 KST 화요일
    ends_at: '2026-06-02T09:00:00.000Z',
    is_all_day: false,
    created_by: 'u-officer',
    created_at: ago(5 * DAY),
    updated_at: ago(5 * DAY),
    deleted_at: null,
  },
  {
    id: 'e-3',
    title: '학과 학회 보조 (자원봉사)',
    description_md: '학과 학회 진행 보조. 점심 제공.',
    location: '대강당',
    starts_at: '2026-06-03T00:00:00.000Z', // 09:00 KST
    ends_at: '2026-06-03T08:00:00.000Z',
    is_all_day: false,
    created_by: 'u-officer',
    created_at: ago(2 * DAY),
    updated_at: ago(2 * DAY),
    deleted_at: null,
  },
  {
    id: 'e-4',
    title: '여름 MT (1박 2일)',
    description_md: '여름 단합 MT — 가평. 회비 별도 안내.',
    location: '가평 펜션',
    starts_at: '2026-07-04T01:00:00.000Z',
    ends_at: '2026-07-05T03:00:00.000Z',
    is_all_day: false,
    created_by: 'u-officer',
    created_at: ago(1 * DAY),
    updated_at: ago(1 * DAY),
    deleted_at: null,
  },
];

export function getDemoEvent(id: string): Event | null {
  return demoEvents.find((e) => e.id === id) ?? null;
}

// ------------------------------------------------------------
// 회비
// ------------------------------------------------------------
export const demoDuesTerms: DuesTermItem[] = [
  {
    id: 't-2026-1',
    label: '2026-1학기',
    amount_krw: 50000,
    due_date: '2026-04-30',
    description_md:
      '우리은행 1234-5678-901234\n예금주: 원우회 박현우\n입금 시 이름+학번 4자리 기재',
    created_at: ago(45 * DAY),
  },
  {
    id: 't-2025-2',
    label: '2025-2학기',
    amount_krw: 50000,
    due_date: '2025-10-31',
    description_md: '우리은행 1234-5678-901234',
    created_at: ago(200 * DAY),
  },
  {
    id: 't-2025-1',
    label: '2025-1학기',
    amount_krw: 50000,
    due_date: '2025-04-30',
    description_md: '우리은행 1234-5678-901234',
    created_at: ago(380 * DAY),
  },
];

// 회원 본인 (김지민) 학기별 납부 내역
export const demoMyDues: MyDuesRow[] = [
  {
    id: 'pay-jimin-2026-1',
    status: 'paid',
    paid_at: ago(40 * DAY),
    memo: '4월 10일 입금 확인',
    memo_public: true,
    updated_at: ago(40 * DAY),
    dues_term: {
      id: 't-2026-1',
      label: '2026-1학기',
      amount_krw: 50000,
      due_date: '2026-04-30',
      description_md: demoDuesTerms[0].description_md,
    },
  },
  {
    id: 'pay-jimin-2025-2',
    status: 'exempt',
    paid_at: null,
    memo: null,
    memo_public: false,
    updated_at: ago(220 * DAY),
    dues_term: {
      id: 't-2025-2',
      label: '2025-2학기',
      amount_krw: 50000,
      due_date: '2025-10-31',
      description_md: null,
    },
  },
  {
    id: 'pay-jimin-2025-1',
    status: 'unpaid',
    paid_at: null,
    memo: null,
    memo_public: false,
    updated_at: ago(380 * DAY),
    dues_term: {
      id: 't-2025-1',
      label: '2025-1학기',
      amount_krw: 50000,
      due_date: '2025-04-30',
      description_md: null,
    },
  },
];

// 임원용 — 2026-1학기 매트릭스 (전체 회원 × 단일 학기 행)
export const demoDuesMatrix: DuesMatrixRow[] = [
  {
    id: 'pay-jimin-2026-1',
    status: 'paid',
    memo: '4/10 입금 확인',
    memo_public: true,
    paid_at: ago(40 * DAY),
    member: {
      id: 'u-current',
      name: '김지민',
      cohort_year: 2026,
      lab: '인공지능 연구실',
      phone: '010-1234-5678',
    },
  },
  {
    id: 'pay-sua-2026-1',
    status: 'unpaid',
    memo: null,
    memo_public: false,
    paid_at: null,
    member: {
      id: 'u-sua',
      name: '이수아',
      cohort_year: 2024,
      lab: '컴퓨터비전 연구실',
      phone: '010-3456-7890',
    },
  },
  {
    id: 'pay-hyunwoo-2026-1',
    status: 'paid',
    memo: null,
    memo_public: false,
    paid_at: ago(50 * DAY),
    member: {
      id: 'u-officer',
      name: '박현우',
      cohort_year: 2023,
      lab: '데이터마이닝 연구실',
      phone: '010-2345-6789',
    },
  },
  {
    id: 'pay-minjun-2026-1',
    status: 'unpaid',
    memo: '카톡으로 일주일만 미뤄달라고 함',
    memo_public: false,
    paid_at: null,
    member: {
      id: 'u-minjun',
      name: '정민준',
      cohort_year: 2025,
      lab: '자연어처리 연구실',
      phone: '010-4567-8901',
    },
  },
  {
    id: 'pay-soeun-2026-1',
    status: 'exempt',
    memo: '조교 면제',
    memo_public: true,
    paid_at: null,
    member: {
      id: 'u-soeun',
      name: '한소은',
      cohort_year: 2024,
      lab: '로보틱스 연구실',
      phone: '010-5678-9012',
    },
  },
];

// ------------------------------------------------------------
// 가입 승인 큐
// ------------------------------------------------------------
export const demoPendingMembers: PendingMember[] = [
  {
    id: 'pending-1',
    name: '최지훈',
    email: 'jihoon.choi@dept.ac.kr',
    student_id: '2026445566',
    cohort_year: 2026,
    lab: '강화학습 연구실',
    phone: '010-7777-1111',
    created_at: ago(1 * HOUR),
  },
  {
    id: 'pending-2',
    name: '윤서아',
    email: 'seoa.yoon@dept.ac.kr',
    student_id: '2026998877',
    cohort_year: 2026,
    lab: '바이오인포 연구실',
    phone: '010-7777-2222',
    created_at: ago(8 * HOUR),
  },
  {
    id: 'pending-3',
    name: '강도윤',
    email: 'doyoon.kang@dept.ac.kr',
    student_id: '2026334455',
    cohort_year: 2026,
    lab: '시스템 연구실',
    phone: null,
    created_at: ago(1 * DAY),
  },
];

// ------------------------------------------------------------
// 데모 진입 페이지에 노출할 화면 카탈로그
// ------------------------------------------------------------
export interface DemoScreen {
  scrId: string; // SCR-XXX
  href: string;
  name: string;
  role: '회원' | '임원' | '공통';
  description?: string;
}

export const demoScreens: DemoScreen[] = [
  {
    scrId: 'SCR-001',
    href: '/demo/login',
    name: '로그인',
    role: '공통',
    description: '이메일/비밀번호 로그인 UI',
  },
  {
    scrId: 'SCR-002',
    href: '/demo/signup',
    name: '가입 신청',
    role: '공통',
    description: '신규 회원 가입 폼',
  },
  {
    scrId: 'SCR-003',
    href: '/demo/pending',
    name: '가입 승인 대기',
    role: '공통',
    description: '승인 대기 안내 화면',
  },
  {
    scrId: 'SCR-010',
    href: '/demo/home',
    name: '홈 대시보드',
    role: '회원',
    description: '핀 공지 + 다가오는 일정 + 내 회비',
  },
  {
    scrId: 'SCR-020',
    href: '/demo/notices',
    name: '공지 목록',
    role: '회원',
  },
  {
    scrId: 'SCR-021',
    href: '/demo/notices/sample',
    name: '공지 상세',
    role: '회원',
  },
  {
    scrId: 'SCR-030',
    href: '/demo/board',
    name: '게시판 목록',
    role: '회원',
  },
  {
    scrId: 'SCR-031',
    href: '/demo/board/sample',
    name: '게시글 상세 + 댓글',
    role: '회원',
  },
  {
    scrId: 'SCR-040',
    href: '/demo/calendar',
    name: '일정 (캘린더 + 리스트)',
    role: '회원',
  },
  {
    scrId: 'SCR-050',
    href: '/demo/dues-member',
    name: '내 회비 내역',
    role: '회원',
  },
  {
    scrId: 'SCR-060',
    href: '/demo/dues-admin',
    name: '회비 매트릭스',
    role: '임원',
    description: '학기별 납부 현황 + 편집',
  },
  {
    scrId: 'SCR-080',
    href: '/demo/approvals',
    name: '가입 승인 큐',
    role: '임원',
  },
];

// 데모 모드에서 사용자 정보를 표시할 때 사용 (Profile 호환).
export const demoProfileMember: Profile = {
  id: currentDemoMember.id,
  email: currentDemoMember.email,
  name: currentDemoMember.name,
  student_id: currentDemoMember.student_id,
  cohort_year: currentDemoMember.cohort_year,
  lab: currentDemoMember.lab,
  phone: currentDemoMember.phone,
  role: 'member',
  status: 'active',
  approved_at: ago(60 * DAY),
  approved_by: 'u-officer',
  rejected_reason: null,
  rejection_reason: null,
  is_anonymous_placeholder: false,
  created_at: ago(60 * DAY),
  updated_at: ago(60 * DAY),
  deleted_at: null,
};
