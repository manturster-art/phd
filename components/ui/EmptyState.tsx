// C-250 EmptyState / C-251 ErrorState — Apple 그래머: 정제된 카피 + 보조 텍스트.
import { type ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  cta?: ReactNode;
}

export function EmptyState({ icon, title, description, cta }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
      {icon && (
        <div className="text-3xl text-text-muted" aria-hidden>
          {icon}
        </div>
      )}
      <p className="text-lg font-semibold text-text-primary">{title}</p>
      {description && (
        <p className="text-sm text-text-secondary">{description}</p>
      )}
      {cta && <div className="mt-2">{cta}</div>}
    </div>
  );
}
