// SCR-073 비밀번호 재설정 (P1 동작, P0는 placeholder UI)
import Link from 'next/link';

export const metadata = { title: '비밀번호 재설정 · 원우회' };

export default function ResetPage() {
  return (
    <div className="mx-auto max-w-sm py-10 text-center">
      <h1 className="text-xl font-semibold">비밀번호 재설정</h1>
      <p className="mt-3 text-sm text-text-secondary">
        이 기능은 P1 릴리스에서 제공됩니다.<br />
        현재는 임원에게 직접 문의해주세요.
      </p>
      <Link href="/login" className="mt-6 inline-block text-sm text-primary-500 hover:underline">
        ← 로그인으로
      </Link>
    </div>
  );
}
