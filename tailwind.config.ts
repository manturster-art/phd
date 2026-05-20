import type { Config } from 'tailwindcss';

// Apple.com design-system 기반 토큰 — 토큰 이름은 보존, 값만 교체.
// 출처: _workspace/external/apple-design-system.md
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Action Blue — 단일 액션 컬러. 모든 인터랙티브 = primary-500.
        // 50/100 은 본문 표면에서 사용되지만 채도가 매우 낮아 거의 무채색 톤으로.
        primary: {
          50: '#f5f5f7',   // parchment alias (배경 강조용)
          100: '#e8eef7',  // 매우 옅은 액션 블루 계열 (배지/얇은 강조)
          500: '#0066cc',  // Action Blue
          600: '#0066cc',  // 동일 — hover 시 transform: scale 로 표현
          700: '#0055aa',  // active 시 약간 더 짙은 톤 (필요한 곳만)
        },
        surface: '#FFFFFF',          // canvas
        bg: {
          DEFAULT: '#f5f5f7',        // parchment — 페이지 배경
          subtle: '#fafafc',         // pearl — 더 옅은 보조 배경
        },
        text: {
          primary: '#1d1d1f',        // ink (headline + body)
          secondary: '#6e6e73',      // muted body
          muted: '#7a7a7a',          // ink-muted-48 (legal/disabled)
          inverse: '#FFFFFF',
        },
        border: {
          DEFAULT: '#e0e0e0',        // hairline
          strong: '#d2d2d7',
        },
        // Semantic — 의미 보존하되 채도 낮춘 톤. 회비 상태 표시용.
        success: {
          DEFAULT: '#1d7a3d',        // muted green
          bg: '#eaf4ee',
        },
        warning: {
          DEFAULT: '#8a5a00',        // muted amber
          bg: '#f7efe1',
        },
        danger: {
          DEFAULT: '#a8261c',        // muted red
          bg: '#f5e7e5',
        },
        info: {
          DEFAULT: '#0066cc',        // == Action Blue. 정보 강조는 액션 컬러로 통합.
        },
        neutral: {
          bg: '#f5f5f7',             // parchment 동일
        },
      },
      fontFamily: {
        // SF Pro → Apple SD Gothic Neo → Noto Sans KR 순서로 한국어 환경 지원.
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Apple SD Gothic Neo"',
          '"Pretendard"',
          '"Noto Sans KR"',
          'system-ui',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // 17px 본문 기준 + Apple 행간/트래킹. 한국어는 트래킹을 -0.01em 로 완화.
      fontSize: {
        xs: ['12px', { lineHeight: '1.33', letterSpacing: '-0.005em' }],     // fine-print
        sm: ['14px', { lineHeight: '1.43', letterSpacing: '-0.01em' }],      // caption
        base: ['17px', { lineHeight: '1.47', letterSpacing: '-0.01em' }],    // body
        lg: ['21px', { lineHeight: '1.19', letterSpacing: '-0.015em' }],     // tagline
        xl: ['24px', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        '2xl': ['28px', { lineHeight: '1.14', letterSpacing: '-0.02em' }],   // lead
        '3xl': ['34px', { lineHeight: '1.12', letterSpacing: '-0.02em' }],
        '4xl': ['40px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],    // display-lg
      },
      letterSpacing: {
        tight: '-0.02em',
        normal: '-0.01em',
        loose: '0em',
      },
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
      },
      borderRadius: {
        none: '0',
        xs: '5px',
        sm: '8px',     // dark utility button
        md: '11px',    // pearl button (소형)
        lg: '18px',    // store utility card
        xl: '20px',
        pill: '9999px',
        full: '9999px',
      },
      boxShadow: {
        // 카드/버튼/텍스트에 그림자 금지 — sm/md/lg 는 사실상 none.
        sm: 'none',
        md: 'none',
        lg: 'none',
        // 키보드 포커스 링 — 2px Focus Blue.
        focus: '0 0 0 2px #0071e3',
        // FAB / 제품 그림자 — Apple 시스템의 유일한 drop-shadow.
        product: '0 5px 30px 3px rgba(0,0,0,0.22)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '320ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
        emphasized: 'cubic-bezier(0.3, 0, 0, 1)',
      },
      zIndex: {
        base: '0',
        sticky: '100',
        bottomBar: '200',
        fab: '300',
        sheet: '400',
        modal: '500',
        toast: '600',
      },
      maxWidth: {
        app: '720px',
      },
      screens: {
        sm: '360px',
        md: '640px',
        lg: '1024px',
      },
      scale: {
        '95': '0.95',   // Apple active state — transform: scale(0.95)
      },
    },
  },
  plugins: [],
};

export default config;
