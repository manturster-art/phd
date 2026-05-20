// SCR-060 데모 — 회비 매트릭스 (임원)
import Link from 'next/link';
import { AppBar } from '@/components/layout/AppBar';
import { Badge } from '@/components/ui/Badge';
import { DemoDuesAdminClient } from './DemoDuesAdminClient';
import { demoDuesTerms, demoDuesMatrix } from '@/lib/demo/mockData';

export const metadata = { title: '데모 · 회비 관리' };

export default function DemoDuesAdminPage() {
  return (
    <>
      <AppBar
        title="회비 관리"
        leading="back"
        trailing={
          <Link
            href="/demo/dues-member"
            className="rounded-pill border border-primary-500 px-4 py-1.5 text-xs font-normal text-primary-500 active:scale-95 transition-transform"
          >
            회원 모드 →
          </Link>
        }
      />
      <div className="space-y-3 py-4">
        <div className="flex items-center gap-2">
          <Badge tone="warning">임원 권한 미리보기</Badge>
          <p className="text-xs text-text-secondary">
            실제 환경에서는 임원/관리자만 접근 가능합니다.
          </p>
        </div>
        <DemoDuesAdminClient terms={demoDuesTerms} matrix={demoDuesMatrix} />
      </div>
    </>
  );
}
