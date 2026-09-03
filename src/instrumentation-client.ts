// @sentry/nextjs 10.x는 클라이언트 초기화를 sentry.client.config.ts 대신
// Next.js의 instrumentation-client.ts 파일 관례로 옮겼다(구 방식은 DEPRECATION
// WARNING을 내고 Turbopack에서 동작하지 않는다). 설치된 SDK 버전의 공식 관례를
// 따른다 — task-19-report.md 참고.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
  tracesSampleRate: 0.1,
});

// 라우터 전환 추적을 위해 SDK가 요구하는 훅. 없으면 빌드 시 ACTION REQUIRED 경고가 뜬다.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
