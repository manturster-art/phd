// C-210 SectionHeader
import Link from 'next/link';
import { type ReactNode } from 'react';

interface Props {
  title: string;
  action?: { label: string; href: string };
  icon?: ReactNode;
}

export function SectionHeader({ title, action, icon }: Props) {
  return (
    <div className="mt-6 mb-2 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
        {icon && <span aria-hidden>{icon}</span>}
        {title}
      </h2>
      {action && (
        <Link
          href={action.href}
          className="text-sm font-medium text-primary-600 hover:underline"
        >
          {action.label} →
        </Link>
      )}
    </div>
  );
}
