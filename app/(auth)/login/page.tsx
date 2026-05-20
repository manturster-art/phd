// SCR-001 로그인
import { LoginForm } from './LoginForm';

export const metadata = { title: '로그인 · 원우회' };

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { reason?: string };
}) {
  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary-600">원우회</h1>
        <p className="mt-2 text-sm text-text-secondary">대학원 원우회 커뮤니티</p>
      </div>
      {searchParams?.reason === 'suspended' && (
        <div className="mb-4 rounded-md bg-danger-bg p-3 text-sm text-danger" role="alert">
          정지된 계정입니다. 임원에게 문의해주세요.
        </div>
      )}
      <LoginForm />
    </div>
  );
}
