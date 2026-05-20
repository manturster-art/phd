// C-100 AppBar
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode } from 'react';

interface Props {
  title: string;
  leading?: 'back' | 'none' | ReactNode;
  trailing?: ReactNode;
}

export function AppBar({ title, leading = 'none', trailing }: Props) {
  const router = useRouter();

  let leadingEl: ReactNode = null;
  if (leading === 'back') {
    leadingEl = (
      <button
        type="button"
        aria-label="뒤로"
        onClick={() => router.back()}
        className="-ml-2 flex h-11 w-11 items-center justify-center rounded-md text-text-primary hover:bg-bg-subtle"
      >
        <span aria-hidden>←</span>
      </button>
    );
  } else if (leading && leading !== 'none') {
    leadingEl = leading;
  }

  return (
    <header
      className="sticky top-0 z-sticky border-b border-border bg-surface"
      style={{ paddingTop: `var(--sat, 0px)` }}
    >
      <div className="app-container flex h-12 items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {leadingEl}
          <h1 className="truncate text-base font-semibold text-text-primary">{title}</h1>
        </div>
        <div className="flex items-center gap-1">{trailing}</div>
      </div>
    </header>
  );
}
