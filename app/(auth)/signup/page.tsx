// SCR-002 가입 신청
import Link from 'next/link';
import { SignupForm } from './SignupForm';

export const metadata = { title: '가입 신청 · 원우회' };

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/login" aria-label="뒤로" className="h-11 w-11 -ml-2 flex items-center justify-center rounded-pill hover:bg-bg active:scale-95">←</Link>
        <h1 className="text-xl font-semibold">가입 신청</h1>
      </div>
      <SignupForm />
    </div>
  );
}
