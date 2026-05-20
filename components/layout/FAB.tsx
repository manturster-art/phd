// C-160 FAB — Apple Action Blue 원형. 시스템에서 유일하게 정당화되는 product-shadow 재활용.
'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface Props {
  href: string;
  label: string;
  icon?: string;
}

export function FAB({ href, label, icon = '✏️' }: Props) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        'fixed right-4 z-fab flex h-14 w-14 items-center justify-center rounded-full',
        'bg-primary-500 text-white shadow-product',
        'active:scale-95 transition-transform'
      )}
      style={{ bottom: `calc(72px + var(--sab, 0px))` }}
    >
      <span aria-hidden className="text-2xl">
        {icon}
      </span>
    </Link>
  );
}
