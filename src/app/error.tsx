'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';
import { ErrorState } from '@/shared/ui/empty-state';

// 라우트 안에서 렌더 오류가 나도 앱 셸(탭바·헤더)은 남기고 이 영역만 복구 화면을 보여준다.
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4">
      <ErrorState
        title="문제가 생겼어요"
        description="잠시 후 다시 시도해 주세요. 계속되면 운영진에게 알려 주세요."
        onRetry={reset}
      />
      <Link href="/dashboard" className="inline-flex min-h-[44px] items-center text-sm text-muted-foreground underline">
        홈으로 가기
      </Link>
    </div>
  );
}
