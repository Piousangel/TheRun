import { LoginPageContent } from '@/widgets/login/ui/login-page-content';

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next } = await searchParams;

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-md">
        <LoginPageContent errorKey={error ?? null} nextPath={next ?? '/me'} />
      </div>
    </main>
  );
}
