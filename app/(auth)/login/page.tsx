// SCR-001 로그인
import { LoginForm } from './LoginForm';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: '로그인 · 원우회' };
export const dynamic = 'force-dynamic';

// v0.2: reason 분기
// - rejected  : 가입 반려 — rejection_reason 함께 표시
// - suspended : 정지된 계정
// - withdrawn : 탈퇴한 계정
function reasonLabel(reason: string | undefined): string | null {
  if (reason === 'rejected') return '가입이 반려되었습니다.';
  if (reason === 'suspended') return '정지된 계정입니다. 임원에게 문의해주세요.';
  if (reason === 'withdrawn') return '탈퇴 처리된 계정입니다. 임원에게 문의해주세요.';
  return null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { reason?: string };
}) {
  const reason = searchParams?.reason;
  const label = reasonLabel(reason);

  // v0.2 B-01: rejected 인 경우 rejection_reason 을 표시한다.
  // middleware 가 status=rejected 면 /login?reason=rejected 로 보내며 세션은 유지되므로
  // 서버 컴포넌트에서 본인 프로필을 직접 조회한다.
  let rejectionReason: string | null = null;
  if (reason === 'rejected') {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('rejection_reason, rejected_reason')
          .eq('id', user.id)
          .maybeSingle();
        const row = data as
          | { rejection_reason: string | null; rejected_reason: string | null }
          | null;
        rejectionReason = row?.rejection_reason ?? row?.rejected_reason ?? null;
      }
    } catch {
      // 세션 없음 등은 무시 — 안내 문구만 표시.
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">원우회</h1>
        <p className="mt-2 text-sm text-text-secondary">대학원 원우회 커뮤니티</p>
      </div>
      {label && (
        <div className="mb-4 rounded-lg bg-danger-bg p-4 text-sm text-danger" role="alert">
          <p className="font-medium">{label}</p>
          {reason === 'rejected' && rejectionReason && (
            <p className="mt-1 text-xs text-danger/90">
              사유: {rejectionReason}
            </p>
          )}
          {reason === 'rejected' && (
            <p className="mt-1 text-xs text-danger/80">
              문의는 원우회 임원에게 부탁드립니다.
            </p>
          )}
        </div>
      )}
      <LoginForm />
    </div>
  );
}
