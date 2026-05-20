// SCR-050 회원 내 납부 내역
import Link from 'next/link';
import { AppBar } from '@/components/layout/AppBar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { DuesHistoryCard } from '@/components/dues/DuesHistoryCard';
import { createClient } from '@/lib/supabase/server';
import { listMyDues } from '@/lib/api/dues';
import { getCurrentProfile, isOfficer } from '@/lib/utils/auth';

export const metadata = { title: '회비 · 원우회' };

export default async function DuesPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const supabase = createClient();
  const rows = await listMyDues(supabase, profile.id).catch(() => []);

  return (
    <>
      <AppBar
        title="회비"
        trailing={
          isOfficer(profile) ? (
            <Link
              href="/dues/admin"
              className="rounded-pill bg-primary-500 px-4 py-1.5 text-xs font-normal text-white active:scale-95 transition-transform"
            >
              임원 모드 →
            </Link>
          ) : null
        }
      />
      <div className="space-y-4 py-4">
        <InfoBanner>
          회비는 계좌이체 후 총무가 확인하여 납부 처리합니다.<br />
          계좌 안내는 각 학기 항목 상세에서 확인하세요.
        </InfoBanner>
        <h2 className="text-sm font-semibold text-text-secondary">학기별 납부 내역</h2>
        {rows.length === 0 ? (
          <Card>
            <EmptyState
              icon="💰"
              title="아직 회비 항목이 없습니다"
              description="학기가 시작되면 총무가 항목을 등록합니다."
            />
          </Card>
        ) : (
          <Card>
            {rows.map((r) => (
              // v0.3: 항목 상세(SCR-051) 진입.
              <Link
                key={r.id}
                href={`/dues/${r.id}`}
                className="block hover:bg-bg transition-colors"
              >
                <DuesHistoryCard row={r} />
              </Link>
            ))}
          </Card>
        )}
      </div>
    </>
  );
}
