// @sentry/nextjs 10.x는 `withSentryConfig`를 `@sentry/nextjs/config`에서 가져오도록 옮겼다
// (루트 패키지 re-export는 v11에서 제거 예정 deprecation 경고를 낸다). 설치된 SDK 버전의
// 공식 관례를 따른다 — task-19-report.md 참고.
import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

// SENTRY_AUTH_TOKEN이 없으면 소스맵 업로드는 건너뛴다(빌드는 성공).
export default withSentryConfig(nextConfig, {
  silent: true,
  widenClientFileUpload: true,
  webpack: {
    treeshake: { removeDebugLogging: true },
  },
});
