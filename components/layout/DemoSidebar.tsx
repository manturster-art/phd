// 데모 페이지에서 데스크톱 화면일 때 좌측에 노출되는 사이드바.
// 모바일에선 숨겨지고, lg 이상에서만 노출.
import Link from 'next/link';
import { demoScreens } from '@/lib/demo/mockData';

export function DemoSidebar() {
  return (
    <aside
      aria-label="다른 데모 화면"
      className="hidden lg:block fixed left-4 top-24 w-60 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-md border border-border bg-surface p-3 text-sm shadow-sm"
    >
      <p className="mb-2 text-xs font-semibold text-text-secondary">
        다른 데모 화면
      </p>
      <ul className="space-y-1">
        <li>
          <Link
            href="/demo"
            className="block rounded-md px-2 py-1.5 text-text-primary hover:bg-bg-subtle"
          >
            ← 데모 홈
          </Link>
        </li>
        {demoScreens.map((s) => (
          <li key={s.scrId}>
            <Link
              href={s.href}
              className="block rounded-md px-2 py-1.5 hover:bg-bg-subtle"
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
