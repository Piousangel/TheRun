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
      title="소셜 로그인"
      description="Google 중심으로 빠르게 로그인하고, 이후 내 멤버를 연결해 앱 흐름으로 들어가게 만듭니다."
    >
        <LoginPageContent errorKey={error ?? null} nextPath={safeInternalPath(next)} />
    </AuthShell>
  );
}
