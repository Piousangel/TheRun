'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Globe, ShieldCheck } from 'lucide-react';
import type { Provider } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/shared/api/supabase/config';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';

const ERROR_MESSAGES: Record<string, string> = {
  'invalid-link': '로그인 링크가 올바르지 않습니다. 다시 시도해주세요.',
  'auth-failed': '로그인 확인에 실패했습니다. 새 링크를 발급받아주세요.',
  'naver-setup-required': '네이버 로그인은 보안 설정을 마친 뒤 순차적으로 열릴 예정입니다.',
};

interface LoginPageContentProps {
  errorKey: string | null;
  nextPath: string;
}

export function LoginPageContent({ errorKey, nextPath }: LoginPageContentProps) {
  const [isSubmitting, setIsSubmitting] = useState<Provider | 'naver' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const errorMessage = useMemo(() => {
    if (!errorKey) {
      return null;
    }

    return ERROR_MESSAGES[errorKey] ?? '로그인 중 문제가 발생했습니다.';
  }, [errorKey]);

  const handleGoogleLogin = async () => {
    setIsSubmitting('google');
    setMessage(null);

    const redirectTo = new URL('/auth/callback', window.location.origin);
    redirectTo.searchParams.set('next', nextPath);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo.toString(),
      },
    });

    if (error) {
      setMessage(error.message);
      toast.error(error.message);
      setIsSubmitting(null);
      return;
    }

    toast.success('Google 로그인 화면으로 이동합니다.');
    setIsSubmitting(null);
  };

  const handleNaverClick = () => {
    setIsSubmitting('naver');
    setMessage('네이버 로그인은 보안 설정을 마친 뒤 순차적으로 열릴 예정입니다. 지금은 Google 로그인을 먼저 사용해주세요.');
    toast.message('Naver 로그인은 곧 열릴 예정입니다. 지금은 Google 로그인을 사용해주세요.');
    setIsSubmitting(null);
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-primary/15 bg-[linear-gradient(155deg,rgba(200,168,88,0.12),rgba(255,255,255,0.96))] p-6 text-center shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">The Run Access</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">소셜 로그인</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          멤버별 개인 사용 흐름으로 전환 중입니다. Google 중심으로 빠르게 로그인하고, 이후 내 멤버를 연결해 본인 기준으로 사용합니다.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Badge variant="secondary">Google 즉시 연결</Badge>
          <Badge variant="secondary">Naver 순차 오픈</Badge>
          <Badge variant="secondary">개인 응답 흐름</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            소셜 로그인
          </CardTitle>
          <CardDescription>지금은 Google로 바로 로그인할 수 있고, Naver는 보안 설정을 마친 뒤 같은 흐름으로 이어질 예정입니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {(errorMessage || message) && (
              <p className={`text-sm ${errorMessage ? 'text-destructive' : 'text-primary'}`}>
                {errorMessage ?? message}
              </p>
            )}

            <Button className="w-full" type="button" onClick={handleGoogleLogin} disabled={isSubmitting !== null}>
              {isSubmitting === 'google' ? 'Google로 이동 중...' : 'Google로 로그인'}
            </Button>

            <Button className="w-full" type="button" variant="outline" onClick={handleNaverClick} disabled={isSubmitting !== null}>
              {isSubmitting === 'naver' ? '오픈 준비 중...' : 'Naver 오픈 예정'}
            </Button>

            <p className="text-xs leading-6 text-muted-foreground">
              Google은 바로 연결됩니다. Naver는 보안 설정과 외부 OAuth 연결을 마친 뒤 안정적으로 열 예정입니다.
            </p>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            지금 바뀌는 점
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>- 멤버는 자기 계정으로 로그인하고 본인 기준으로 투표/출석합니다.</p>
          <p>- 관리자만 멤버 생성, 수정, 삭제 같은 운영 작업을 보게 됩니다.</p>
          <p>- 로그인 흐름은 실제 동호회 사용 기준으로 계속 다듬고 있습니다.</p>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <Link href="/" className="underline underline-offset-4">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
