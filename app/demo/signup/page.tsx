// SCR-002 데모 — 가입 신청 화면 (UI 만)
import Link from 'next/link';
import { DemoSignupForm } from './DemoSignupForm';

export const metadata = { title: '데모 · 가입 신청' };

export default function DemoSignupPage() {
  return (
    <div className="mx-auto max-w-sm py-6">
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/demo/login"
          aria-label="뒤로"
          className="h-11 w-11 -ml-2 flex items-center justify-center rounded-pill hover:bg-bg active:scale-95"
        >
          ←
        </Link>
        <h1 className="text-xl font-semibold">가입 신청</h1>
      </div>
      <DemoSignupForm />
    </div>
  );
}
