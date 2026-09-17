import { test, expect, type Page, type TestInfo } from '@playwright/test';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';
import { findFixedOverlaps, waitForPageReady } from './layout-guards';

const ROUTES = ['/dashboard', '/votes', '/matches', '/attendance', '/more', '/announcements', '/members', '/me', '/strategy', '/club-guide'];

async function capture(page: Page, testInfo: TestInfo, route: string, suffix: string) {
  const file = testInfo.outputPath(`${testInfo.project.name}-${suffix}${route.replace(/\//g, '_')}.png`);
  await page.screenshot({ path: file });
  await testInfo.attach(`${suffix}${route}`, { path: file, contentType: 'image/png' });
}

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

async function expectNoFixedOverlap(page: Page, where: string) {
  const overlaps = await findFixedOverlaps(page);
  expect(overlaps, `${where}: fixed 요소가 상호작용 요소를 덮는다`).toEqual([]);
}

async function scrollToBottom(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
}

test.describe('앱 셸이 콘텐츠를 가리지 않는다', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  test('모바일: 탭바·떠 있는 요소·가로 스크롤', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', '모바일 프로젝트 전용');

    for (const route of ROUTES) {
      await test.step(route, async () => {
        await page.goto(route);
        await waitForPageReady(page);
        await capture(page, testInfo, route, 'top');
        await expectNoHorizontalScroll(page);

        const tabBar = page.getByRole('navigation', { name: '주요 메뉴' });
        await expect(tabBar).toBeVisible();
        const tabBox = (await tabBar.boundingBox())!;
        await expectNoFixedOverlap(page, `${route} 상단`);

        await scrollToBottom(page);
        const contentBottom = await page.evaluate(() => {
          const main = document.querySelector('main');
          const last = main?.lastElementChild as HTMLElement | null;
          return last ? last.getBoundingClientRect().bottom : 0;
        });
        expect(contentBottom, '마지막 콘텐츠가 탭바 아래로 들어간다').toBeLessThanOrEqual(tabBox.y + 1);
        await expectNoFixedOverlap(page, `${route} 하단`);
        await capture(page, testInfo, route, 'bottom');
      });
    }
  });

  for (const width of [800, 1024, 1440]) {
    test(`데스크톱 ${width}px: 사이드바·떠 있는 요소·가로 스크롤`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', '데스크톱 프로젝트 전용');
      await page.setViewportSize({ width, height: 900 });

      for (const route of ROUTES) {
        await test.step(route, async () => {
          await page.goto(route);
          await waitForPageReady(page);
          await expect(page.getByRole('navigation', { name: '사이드 메뉴' })).toBeVisible();
          await expect(page.getByRole('navigation', { name: '주요 메뉴' })).toBeHidden();
          await expectNoHorizontalScroll(page);
          await expectNoFixedOverlap(page, `${width}px ${route} 상단`);
          await capture(page, testInfo, route, `w${width}`);

          await scrollToBottom(page);
          await expectNoFixedOverlap(page, `${width}px ${route} 하단`);
        });
      }
    });
  }

  test('Pretendard가 한글 글리프에 실제로 로드된다', async ({ page }) => {
    await page.goto('/more');
    await waitForPageReady(page);
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      await document.fonts.load('16px "Pretendard Variable"', '한글');
      // check()는 일치하는 @font-face가 아예 없어도 true라서, 실제로 로드된 Pretendard 면이 있는지도 본다.
      const hasLoadedFace = [...document.fonts].some(
        (face) => face.family.replace(/["']/g, '') === 'Pretendard Variable' && face.status === 'loaded',
      );
      return hasLoadedFace && document.fonts.check('16px "Pretendard Variable"', '한글');
    });
    expect(loaded).toBe(true);
    const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(family).toMatch(/^"?Pretendard Variable"?/);
  });
});
