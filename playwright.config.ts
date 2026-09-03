import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

export const STORAGE_DIR = path.join(__dirname, 'e2e/.auth');

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    locale: 'ko-KR',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    // CI는 `pnpm dev`가 아니라 빌드된 앱(`next start`)을 상대로 돈다. dev 서버는 라우트마다
    // 온디맨드로 컴파일하는데, ROUTES_TO_WARM이 9개 라우트를 도는 auth.setup.ts 워밍 루프가
    // GitHub 러너의 cold 컴파일 비용까지 60초 setup 타임아웃 안에 다 먹으면서 실패했다
    // (member.json 1.1m/1.0m 두 번 다 타임아웃, 이미 컴파일이 끝나 있던 admin.json은 45.8s에
    // 통과). CI 워크플로가 e2e 전에 이미 local 어댑터로 `pnpm build`를 해두므로 그 산출물을
    // `next start`로 띄우기만 하면 온디맨드 컴파일이 사라진다. 로컬에서는 지금처럼 `pnpm dev`
    // (또는 이미 떠 있는 서버 재사용)가 더 편해서 그대로 둔다.
    command: process.env.CI ? 'pnpm start' : 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: { NEXT_PUBLIC_DATA_ADAPTER: 'local' },
    timeout: 120_000,
  },
  projects: [
    { name: 'setup', testMatch: /_setup\/.*\.setup\.ts/ },
    // 라우트 스윕은 어댑터가 데이터를 내주는지만 보므로 뷰포트와 무관하다. 양쪽에서 돌리면
    // e2e 시간이 두 배로 늘어 desktop에서만 돌린다. 모바일 반응형은 local-adapter 스모크가 덮는다.
    { name: 'mobile', testMatch: /.*\.spec\.ts/, testIgnore: /route-sweep\.spec\.ts/, dependencies: ['setup'], use: { ...devices['iPhone 13'] } },
    { name: 'desktop', testMatch: /.*\.spec\.ts/, dependencies: ['setup'], use: { ...devices['Desktop Chrome'] } },
  ],
});
