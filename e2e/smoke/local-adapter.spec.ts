import { test, expect } from '@playwright/test';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

test.describe('로컬 어댑터 스모크 — 멤버', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'member.json') });

  test('로그인 상태로 대시보드·투표·경기가 시드로 렌더된다', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForLoadState('networkidle');

    await page.goto('/votes');
    await expect(page.getByText('정기 경기').first()).toBeVisible();
    await page.getByRole('tab', { name: /기타/ }).click();
    await expect(page.getByText('경기 후 회식')).toBeVisible();

    await page.goto('/matches');
    await expect(page.getByText('더런 풋살장').first()).toBeVisible();
  });

  test('비로그인 컨텍스트는 /login으로 보낸다', async ({ browser }) => {
    // browser.newContext()는 인자 없이 호출해도 test.use({ storageState })로 지정한
    // 이 describe 블록의 storageState를 기본값으로 물려받는다. 진짜 비로그인 컨텍스트를
    // 만들려면 명시적으로 storageState: undefined를 넘겨 초기화해야 한다.
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
    await context.close();
  });
});

test.describe('로컬 어댑터 스모크 — 관리자', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  test('멤버 디렉토리에 시드 20명이 보인다', async ({ page }) => {
    await page.goto('/members');
    await expect(page.getByText('김민준').first()).toBeVisible();
    await expect(page.getByText('홍유준').first()).toBeVisible();
  });
});
