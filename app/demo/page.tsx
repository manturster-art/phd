// 데모 진입 페이지. 모든 데모 화면 카드 그리드를 노출한다.
// Apple store-utility-card 그래머: 18px 라운드 + hairline 보더 + 24px padding, 그림자 없음.
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
    <div className="py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-text-primary">
          원우회 앱 데모
        </h1>
        <p className="mt-3 text-base text-text-secondary">
          실제 데이터베이스 연결 없이 모든 주요 화면을 둘러볼 수 있는 프로토타입입니다.
          <br />
          버튼 클릭 등 인터랙션은 대부분 비활성화되어 있어요.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {demoScreens.map((s) => (
          <Link
            key={s.scrId}
            href={s.href}
            className="block transition-transform active:scale-95"
          >
            <Card className="h-full p-6 transition-colors hover:bg-bg">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-text-muted">{s.scrId}</p>
                  <h2 className="mt-1 text-base font-semibold text-text-primary">
                    {s.name}
                  </h2>
                  {s.description && (
                    <p className="mt-2 text-sm text-text-secondary">
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

      <footer className="mt-10 rounded-lg border border-border bg-bg p-6 text-sm text-text-secondary">
        <p className="font-semibold text-text-primary">데모 모드 안내</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>모든 데이터는 정적 mock 입니다. 새로고침해도 변하지 않습니다.</li>
          <li>로그인/가입 화면은 UI 만 노출되며 실제 인증은 수행하지 않습니다.</li>
          <li>좋아요·댓글·회비 변경 등 인터랙션은 화면에 안내 메시지만 표시합니다.</li>
          <li>임원/회원 화면이 다른 경우(회비) 페이지 내 토글로 미리 볼 수 있어요.</li>
        </ul>
      </footer>
    </div>
  );
}
