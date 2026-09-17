import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

/**
 * "같은 화면이 Supabase 없이 뜬다"가 이 브랜치의 존재 이유다. 스모크 3케이스는 5개 라우트만
 * 덮으므로, 모든 `page.tsx` 라우트를 관리자 세션으로 한 번씩 열어 에러 배너가 없고 화면이
 * 실제로 렌더됐는지 확인한다.
 */

/** 위젯들이 쿼리 실패 때 띄우는 문구. 하나라도 DOM에 있으면 시드로 렌더되지 않은 것이다. */
const ERROR_BANNER = /문제가 생겼습니다|오류가 발생했습니다|불러올 수 없습니다|Application error/;

/**
 * 라우트별 h1. 이 제목이 보이면 그 화면이 실제로 그려진 것이다.
 */
const STATIC_ROUTES: ReadonlyArray<{ path: string; heading?: string | RegExp }> = [
  { path: '/more', heading: '더보기' },
  { path: '/club-guide', heading: 'The Run 운영 가이드' },
  { path: '/dashboard', heading: /이번 주/ },
  { path: '/attendance', heading: '출석 응답 보드' },
  { path: '/votes', heading: '투표 운영 보드' },
  { path: '/matches', heading: '경기 운영 허브' },
  { path: '/members', heading: '클럽 멤버 디렉토리' },
  { path: '/announcements', heading: '공지 보드' },
  { path: '/me', heading: '내 계정' },
  { path: '/strategy', heading: /팀 구성과 전술 흐름/ },
];

async function expectNoErrorBanner(page: Page) {
  await expect(page.getByText(ERROR_BANNER)).toHaveCount(0);
}

test.describe('라우트 스윕 — 관리자 세션으로 전 라우트가 시드로 렌더된다', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  test('정적 라우트 10곳', async ({ page }) => {
    for (const route of STATIC_ROUTES) {
      await test.step(route.path, async () => {
        await page.goto(route.path);
        await expect(page.locator('main')).toBeVisible();
        if (route.heading) {
          await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
        }
        await expectNoErrorBanner(page);
      });
    }
  });

  test('동적 라우트 3곳 — 목록에서 첫 항목으로 들어간다', async ({ page }) => {
    await test.step('/votes/[id]', async () => {
      await page.goto('/votes');
      await page.getByRole('button', { name: /투표하기|결과 보기/ }).first().click();
      await expect(page).toHaveURL(/\/votes\/[^/]+$/);
      await expect(page.getByRole('heading').first()).toBeVisible();
      await expectNoErrorBanner(page);
    });

    await test.step('/matches/[id]', async () => {
      await page.goto('/matches');
      const href = await page.locator('a[href^="/matches/"]').first().getAttribute('href');
      expect(href).toBeTruthy();
      await page.goto(href!);
      await expect(page).toHaveURL(/\/matches\/[^/]+$/);
      await expect(page.getByRole('heading').first()).toBeVisible();
      await expectNoErrorBanner(page);
    });

    await test.step('/members/[id]', async () => {
      await page.goto('/members');
      const href = await page.locator('a[href^="/members/"]').first().getAttribute('href');
      expect(href).toBeTruthy();
      await page.goto(href!);
      await expect(page).toHaveURL(/\/members\/[^/]+$/);
      await expect(page.getByRole('heading').first()).toBeVisible();
      await expectNoErrorBanner(page);
    });
  });

  test('리다이렉트 라우트 4곳', async ({ page }) => {
    // 서버 리다이렉트라 goto가 목적지 도착 전에 "다른 내비게이션에 가로채였다"로 끝날 수 있다.
    // commit까지만 기다리고 최종 URL은 toHaveURL로 폴링한다.
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto('/team-division', { waitUntil: 'commit' });
    await expect(page).toHaveURL(/\/strategy$/);

    await page.goto('/team-division/A', { waitUntil: 'commit' });
    await expect(page).toHaveURL(/\/strategy\?team=A$/);

    // 로그인 상태로 /login에 오면 미들웨어가 대시보드로 보낸다.
    await page.goto('/login', { waitUntil: 'commit' });
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { level: 1, name: /이번 주/ })).toBeVisible();
    await expectNoErrorBanner(page);
  });
});
