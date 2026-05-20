// 하단 탭바 전용 라인 아이콘 세트.
// Apple SF Symbols grammar: 24x24, stroke 1.5, currentColor, active = filled.
// 색은 currentColor 로 상속되어 active 시 text-primary-500 가 그대로 적용됨.
import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { filled?: boolean };

const baseOutline = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const baseFilled = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  stroke: 'currentColor',
  strokeWidth: 1,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function HomeIcon({ filled, ...rest }: IconProps) {
  if (filled) {
    return (
      <svg {...baseFilled} {...rest} aria-hidden="true">
        <path d="M11.36 3.27a1 1 0 0 1 1.28 0l8.5 6.93c.23.19.36.47.36.77V20a1 1 0 0 1-1 1h-4.5v-5.5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1V21H4a1 1 0 0 1-1-1v-9.03c0-.3.13-.58.36-.77l8-6.93Z" />
      </svg>
    );
  }
  return (
    <svg {...baseOutline} {...rest} aria-hidden="true">
      <path d="M3.5 10.5 12 3.5l8.5 7v9a1 1 0 0 1-1 1H15v-6h-6v6H4.5a1 1 0 0 1-1-1v-9Z" />
    </svg>
  );
}

export function BellIcon({ filled, ...rest }: IconProps) {
  if (filled) {
    return (
      <svg {...baseFilled} {...rest} aria-hidden="true">
        <path d="M12 3a5.5 5.5 0 0 0-5.5 5.5v3.13l-1.3 2.45A1 1 0 0 0 6.08 16h11.84a1 1 0 0 0 .88-1.92l-1.3-2.45V8.5A5.5 5.5 0 0 0 12 3Z" />
        <path d="M10 18a2 2 0 0 0 4 0" fill="none" />
      </svg>
    );
  }
  return (
    <svg {...baseOutline} {...rest} aria-hidden="true">
      <path d="M6.5 15.5h11l-1.5-2.5V8.5a4.5 4.5 0 1 0-9 0V13l-1.5 2.5h1.5Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function BubbleIcon({ filled, ...rest }: IconProps) {
  if (filled) {
    return (
      <svg {...baseFilled} {...rest} aria-hidden="true">
        <path d="M4 11.5a8 8 0 1 1 3.7 6.73l-3.2.74a.5.5 0 0 1-.6-.6l.74-3.2A7.97 7.97 0 0 1 4 11.5Z" />
      </svg>
    );
  }
  return (
    <svg {...baseOutline} {...rest} aria-hidden="true">
      <path d="M4 11.5a8 8 0 1 1 3.7 6.73l-3.2.74a.5.5 0 0 1-.6-.6l.74-3.2A7.97 7.97 0 0 1 4 11.5Z" />
    </svg>
  );
}

export function CalendarIcon({ filled, ...rest }: IconProps) {
  if (filled) {
    return (
      <svg {...baseFilled} {...rest} aria-hidden="true">
        <path d="M7 3v2H5a2 2 0 0 0-2 2v2h18V7a2 2 0 0 0-2-2h-2V3h-1.5v2h-7V3H7Z" />
        <path d="M3 10.5V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8.5H3Z" />
      </svg>
    );
  }
  return (
    <svg {...baseOutline} {...rest} aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
    </svg>
  );
}

// 회비: 원 안 ₩ 글리프(2가로줄 + W 곡선). 폰트 비의존.
// active 시 원 두께만 1.5→2 로 무게감을 더한다 (다른 아이콘의 fill 처리 대응).
export function WonIcon({ filled, ...rest }: IconProps) {
  const ringWeight = filled ? 2 : 1.5;
  return (
    <svg {...baseOutline} {...rest} aria-hidden="true">
      <circle cx="12" cy="12" r="9" strokeWidth={ringWeight} />
      <path d="M7.4 8 9.2 14l1.6-3.6h2.4L14.8 14 16.6 8" strokeWidth={ringWeight} />
      <path d="M6.5 11.5h11M6.5 13.2h11" strokeWidth={1.2} />
    </svg>
  );
}
