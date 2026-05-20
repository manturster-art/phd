// C-110 PrimaryButton / C-111 SecondaryButton / C-112 DangerButton
// Apple 그래머:
//  - primary  : Action Blue pill (full)
//  - secondary: Action Blue 보더 + 투명 배경 pill
//  - ghost    : 텍스트만, 보더 없음
//  - dark     : near-black 8px 라운드 utility button
//  - link     : 인라인 텍스트 링크 (Action Blue)
//  - danger   : 의미적 색 보존하되 채도 낮춤. pill.
// 모든 버튼 active = transform scale(0.95).
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark' | 'link';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary:
    'rounded-pill bg-primary-500 text-white disabled:bg-primary-500/40',
  secondary:
    'rounded-pill bg-transparent text-primary-500 border border-primary-500 disabled:opacity-40',
  ghost:
    'rounded-pill bg-transparent text-text-primary disabled:opacity-40',
  dark:
    'rounded-sm bg-text-primary text-white disabled:opacity-40',
  link:
    'rounded-none bg-transparent text-primary-500 px-0 underline-offset-2 hover:underline disabled:opacity-40',
  danger:
    'rounded-pill bg-danger text-white disabled:bg-danger/40',
};

// pill 버튼은 padding 11×22 가 표준이지만, 모바일 폼의 한국어 라벨이 길어
// 좌우 패딩은 약간 넉넉하게. height 는 터치 타겟 44px 확보.
const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-12 px-6 text-base',
};

const sizeClassDark: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading,
    fullWidth,
    className,
    disabled,
    children,
    ...rest
  },
  ref
) {
  const sizing = variant === 'dark' ? sizeClassDark[size] : sizeClass[size];
  const isLink = variant === 'link';
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-normal',
        'transition-transform duration-fast ease-standard',
        'active:scale-95',
        'focus-visible:outline-none focus-visible:shadow-focus',
        variantClass[variant],
        !isLink && sizing,
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}
      <span>{children}</span>
    </button>
  );
});
