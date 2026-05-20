// SCR-003 데모 — 가입 승인 대기 안내
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const metadata = { title: '데모 · 승인 대기' };

export default function DemoPendingPage() {
  return (
    <div className="mx-auto max-w-sm py-12 text-center">
      <div className="mb-6 text-5xl" aria-hidden>
        ⏳
      </div>
      <h1 className="text-xl font-semibold">가입 신청이 접수되었어요</h1>
      <p className="mt-3 text-sm text-text-secondary">
        임원이 확인 후 승인하면
        <br />
        알림 이메일을 보내드립니다.
        <br />
        보통 1~3일 안에 처리됩니다.
      </p>
      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-center gap-2 text-sm">
          현재 상태: <Badge tone="warning">승인 대기 중</Badge>
        </div>
        <p className="text-xs text-text-secondary">신청일: 2026.05.20 (수)</p>
      </div>
      <div className="mt-8">
        <Link href="/demo/login">
          <Button variant="secondary">로그아웃 (데모)</Button>
        </Link>
      </div>
      <p className="mt-6 text-xs text-text-secondary">
        문의: council@dept.ac.kr
      </p>
    </div>
  );
}
