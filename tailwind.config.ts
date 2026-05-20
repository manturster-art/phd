import type { Config } from 'tailwindcss';

// 디자인 토큰 매핑 (02_designer_uiux.md §5)
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3',
        },
        surface: '#FFFFFF',
        bg: {
          DEFAULT: '#F8FAFC',
          subtle: '#F1F5F9',
        },
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
          inverse: '#FFFFFF',
        },
        border: {
          DEFAULT: '#E2E8F0',
          strong: '#CBD5E1',
        },
        success: {
          DEFAULT: '#16A34A',
          bg: '#DCFCE7',
        },
        warning: {
          DEFAULT: '#D97706',
          bg: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#DC2626',
          bg: '#FEE2E2',
        },
        info: {
          DEFAULT: '#0EA5E9',
        },
        neutral: {
          bg: '#F1F5F9',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.5' }],
        lg: ['18px', { lineHeight: '1.5' }],
        xl: ['20px', { lineHeight: '1.25' }],
        '2xl': ['24px', { lineHeight: '1.25' }],
        '3xl': ['30px', { lineHeight: '1.25' }],
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
      },
      borderRadius: {
        none: '0',
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '20px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15,23,42,0.06)',
        md: '0 4px 12px rgba(15,23,42,0.08)',
        lg: '0 12px 32px rgba(15,23,42,0.12)',
        focus: '0 0 0 3px rgba(79,70,229,0.35)',
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
    },
  },
  plugins: [],
};

export default config;
