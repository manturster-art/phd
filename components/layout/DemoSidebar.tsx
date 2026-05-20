// 데모 사이드바 — Apple 그래머:
// parchment 배경 + ink 텍스트 + 18px 라운드 + hairline 보더, 그림자 없음.
// active 또는 hover 만 Action Blue 또는 흰 표면 강조.
import Link from 'next/link';
import { demoScreens } from '@/lib/demo/mockData';

export function DemoSidebar() {
  return (
    <aside
      aria-label="다른 데모 화면"
      className="hidden lg:block fixed left-4 top-24 w-60 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-lg border border-border bg-bg p-4 text-sm"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
        다른 데모 화면
      </p>
      <ul className="space-y-0.5">
        <li>
          <Link
            href="/demo"
            className="block rounded-sm px-2 py-1.5 text-text-primary hover:bg-surface"
          >
            ← 데모 홈
          </Link>
        </li>
        {demoScreens.map((s) => (
          <li key={s.scrId}>
            <Link
              href={s.href}
              className="block rounded-sm px-2 py-1.5 hover:bg-surface"
            >
              <span className="text-xs text-text-muted">{s.scrId}</span>{' '}
              <span className="text-text-primary">{s.name}</span>
              {s.role !== '공통' && (
                <span className="ml-1 text-xs text-text-muted">· {s.role}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
