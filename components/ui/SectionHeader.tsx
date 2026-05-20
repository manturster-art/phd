// C-210 SectionHeader — Apple 그래머:
// tagline 21px / 600 으로 통일. 보조 액션 링크는 Action Blue.
import Link from 'next/link';
import { type ReactNode } from 'react';

interface Props {
  title: string;
  action?: { label: string; href: string };
  icon?: ReactNode;
}

export function SectionHeader({ title, action, icon }: Props) {
  return (
    <div className="mt-8 mb-3 flex items-end justify-between">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
        {icon && <span aria-hidden>{icon}</span>}
        {title}
      </h2>
      {action && (
        <Link
          href={action.href}
          className="text-sm text-primary-500 hover:underline"
        >
          {action.label} →
        </Link>
      )}
    </div>
  );
}
