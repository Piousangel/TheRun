'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '@/shared/api/supabase/config';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

const ERROR_MESSAGES: Record<string, string> = {
  'invalid-link': '로그인 링크가 올바르지 않습니다. 다시 시도해주세요.',
  'auth-failed': '로그인 확인에 실패했습니다. 새 링크를 발급받아주세요.',
};

interface LoginPageContentProps {
  errorKey: string | null;
  nextPath: string;
}

export function LoginPageContent({ errorKey, nextPath }: LoginPageContentProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const errorMessage = useMemo(() => {
    if (!errorKey) {
      return null;
    }

    return ERROR_MESSAGES[errorKey] ?? '로그인 중 문제가 발생했습니다.';
  }, [errorKey]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const redirectTo = new URL('/auth/confirm', window.location.origin);
    redirectTo.searchParams.set('next', nextPath);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo.toString(),
      },
    });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setMessage('로그인 링크를 보냈습니다. 이메일을 확인해주세요.');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-primary">The Run Access</p>
        <h1 className="text-3xl font-bold">로그인</h1>
        <p className="text-sm text-muted-foreground">
          멤버별 개인 사용 흐름으로 전환 중입니다. 이메일 링크로 로그인한 뒤 내 멤버를 연결하세요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            이메일 링크 로그인
          </CardTitle>
          <CardDescription>비밀번호 없이 메일로 받은 링크로 바로 들어올 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                required
                disabled={isSubmitting}
              />
            </div>

            {(errorMessage || message) && (
              <p className={`text-sm ${errorMessage ? 'text-destructive' : 'text-primary'}`}>
                {errorMessage ?? message}
              </p>
            )}

            <Button className="w-full" type="submit" disabled={isSubmitting || !email.trim()}>
              {isSubmitting ? '링크 전송 중...' : '로그인 링크 받기'}
            </Button>
          </form>
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
          <p>- 다음 단계에서 DB 권한과 운영 플로우를 더 강하게 잠글 예정입니다.</p>
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
