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
    command: 'pnpm dev',
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
