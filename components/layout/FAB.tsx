// C-160 FAB
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
        'bg-primary-500 text-white shadow-lg hover:bg-primary-600 active:bg-primary-700'
      )}
      style={{ bottom: `calc(72px + var(--sab, 0px))` }}
    >
      <span aria-hidden className="text-2xl">{icon}</span>
    </Link>
  );
}
