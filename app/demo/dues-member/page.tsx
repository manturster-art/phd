// SCR-050 데모 — 회원 내 회비 내역
import Link from 'next/link';
import { AppBar } from '@/components/layout/AppBar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { DuesHistoryCard } from '@/components/dues/DuesHistoryCard';
import { demoMyDues } from '@/lib/demo/mockData';

export const metadata = { title: '데모 · 내 회비' };

export default function DemoDuesMemberPage() {
  const rows = demoMyDues;
  return (
    <>
      <AppBar
        title="회비"
        trailing={
          <Link
            href="/demo/dues-admin"
            className="rounded-pill bg-primary-500 px-4 py-1.5 text-xs font-normal text-white active:scale-95 transition-transform"
          >
            임원 모드 미리보기 →
          </Link>
        }
      />
      <div className="space-y-4 py-4">
        <InfoBanner>
          회비는 계좌이체 후 총무가 확인하여 납부 처리합니다.
          <br />
          우리은행 1234-5678-901234 (예금주: 원우회 박현우)
        </InfoBanner>
        <h2 className="text-sm font-semibold text-text-secondary">
          학기별 납부 내역
        </h2>
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
              <DuesHistoryCard key={r.id} row={r} />
            ))}
          </Card>
        )}
      </div>
    </>
  );
}
