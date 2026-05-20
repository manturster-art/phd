// 데모 진입 페이지. 모든 데모 화면 카드 그리드를 노출한다.
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { demoScreens } from '@/lib/demo/mockData';

export const metadata = { title: '데모 홈 · 원우회' };

function roleTone(role: '회원' | '임원' | '공통'): 'primary' | 'warning' | 'neutral' {
  if (role === '임원') return 'warning';
  if (role === '회원') return 'primary';
  return 'neutral';
}

export default function DemoIndexPage() {
  return (
    <div className="py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">원우회 앱 데모</h1>
        <p className="mt-2 text-sm text-text-secondary">
          실제 데이터베이스 연결 없이 모든 주요 화면을 둘러볼 수 있는 프로토타입입니다.<br />
          버튼 클릭 등 인터랙션은 대부분 비활성화되어 있어요.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {demoScreens.map((s) => (
          <Link key={s.scrId} href={s.href} className="block">
            <Card className="p-4 transition-colors hover:bg-bg-subtle">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-text-muted">{s.scrId}</p>
                  <h2 className="mt-0.5 text-base font-semibold text-text-primary">
                    {s.name}
                  </h2>
                  {s.description && (
                    <p className="mt-1 text-xs text-text-secondary">
                      {s.description}
                    </p>
                  )}
                </div>
                <Badge tone={roleTone(s.role)}>{s.role}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </section>

      <footer className="mt-8 rounded-md border border-border bg-bg-subtle p-4 text-xs text-text-secondary">
        <p className="font-medium text-text-primary">데모 모드 안내</p>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          <li>모든 데이터는 정적 mock 입니다. 새로고침해도 변하지 않습니다.</li>
          <li>로그인/가입 화면은 UI 만 노출되며 실제 인증은 수행하지 않습니다.</li>
          <li>좋아요·댓글·회비 변경 등 인터랙션은 화면에 안내 메시지만 표시합니다.</li>
          <li>임원/회원 화면이 다른 경우(회비) 페이지 내 토글로 미리 볼 수 있어요.</li>
        </ul>
      </footer>
    </div>
  );
}
