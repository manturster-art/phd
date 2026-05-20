// SCR-001 데모 — 로그인 화면 (UI 만)
import { DemoLoginForm } from './DemoLoginForm';

export const metadata = { title: '데모 · 로그인' };

export default function DemoLoginPage() {
  return (
    <div className="mx-auto max-w-sm py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary-600">원우회</h1>
        <p className="mt-2 text-sm text-text-secondary">대학원 원우회 커뮤니티</p>
      </div>
      <DemoLoginForm />
    </div>
  );
}
