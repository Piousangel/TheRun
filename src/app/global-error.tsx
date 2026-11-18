'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

// 루트 레이아웃 자체가 실패했을 때의 최후 화면. 레이아웃·CSS가 없으므로 인라인 스타일만 쓴다.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#111' }}>
        <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, margin: 0 }}>앱을 불러오지 못했어요</h1>
          <p style={{ fontSize: 14, color: '#555', margin: 0 }}>새로고침하면 대부분 해결돼요.</p>
          <button
            type="button"
            onClick={reset}
            style={{ minHeight: 44, padding: '0 20px', borderRadius: 12, border: '1px solid #ccc', background: '#fff', fontSize: 15 }}
          >
            다시 시도
          </button>
        </main>
      </body>
    </html>
  );
}
