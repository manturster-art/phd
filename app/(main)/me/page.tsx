// SCR-070 내 프로필
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppBar } from '@/components/layout/AppBar';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LogoutLink } from './LogoutLink';
import { getCurrentProfile, isOfficer, isAdmin } from '@/lib/utils/auth';

export const metadata = { title: '내 프로필 · 원우회' };

export default async function MePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const roleLabel = profile.role === 'admin' ? '관리자' : profile.role === 'officer' ? '임원' : '일반회원';

  return (
    <>
      <AppBar
        title="내 프로필"
        leading="back"
        trailing={<Link href="/me/edit" className="text-sm text-primary-500">수정</Link>}
      />
      <div className="space-y-4 py-4">
        <Card>
          <CardBody className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg text-2xl font-semibold text-text-primary">
              {profile.name.slice(0, 1)}
            </div>
            <p className="mt-3 text-lg font-semibold">{profile.name}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
              <Badge tone={profile.role === 'admin' ? 'danger' : profile.role === 'officer' ? 'primary' : 'neutral'}>
                {roleLabel}
              </Badge>
              {profile.cohort_year != null && <span>{profile.cohort_year}학번</span>}
              {profile.lab && <span>· {profile.lab}</span>}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-2 text-sm">
            <Row label="이메일" value={profile.email} />
            <Row label="학번" value={profile.student_id ?? '-'} />
            <Row label="입학년도" value={profile.cohort_year != null ? String(profile.cohort_year) : '-'} />
            <Row label="연구실" value={profile.lab ?? '-'} />
            <Row label="연락처" value={profile.phone ?? '-'} />
          </CardBody>
        </Card>

        <Card>
          <nav className="divide-y divide-border">
            <Link href="/me/password" className="block px-4 py-3 text-sm hover:bg-bg">
              비밀번호 변경 →
            </Link>
            {isOfficer(profile) && (
              <Link href="/admin/approvals" className="block px-4 py-3 text-sm hover:bg-bg">
                가입 승인 큐 →
              </Link>
            )}
            <LogoutLink />
          </nav>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}
