import { LoginPageContent } from '@/widgets/login/ui/login-page-content';
import { safeInternalPath } from '@/shared/lib/navigation';
import { AuthShell } from '@/shared/ui/auth-shell';

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next } = await searchParams;

  return (
    <AuthShell
      eyebrow="The Run Access"
      title="더런 로그인"
      description="Google·카카오로 로그인하고, 내 멤버를 연결해 투표·출석·경기 기록을 시작하세요."
    >
        <LoginPageContent errorKey={error ?? null} nextPath={safeInternalPath(next)} />
    </AuthShell>
  );
}
