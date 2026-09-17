import { test, expect, type Page, type TestInfo } from '@playwright/test';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

const ROUTES = ['/dashboard', '/votes', '/matches', '/attendance', '/more', '/announcements', '/members', '/me', '/strategy', '/club-guide'];

type Box = { x: number; y: number; width: number; height: number };

function intersects(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

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

test.describe('앱 셸이 콘텐츠를 가리지 않는다', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  test('모바일: 탭바·DEMO 칩·가로 스크롤', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', '모바일 프로젝트 전용');

    for (const route of ROUTES) {
      await test.step(route, async () => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        await capture(page, testInfo, route, 'top');
        await expectNoHorizontalScroll(page);

        const tabBar = page.getByRole('navigation', { name: '주요 메뉴' });
        await expect(tabBar).toBeVisible();
        const tabBox = (await tabBar.boundingBox())!;

        const chip = page.getByRole('button', { name: '데모 메뉴 열기' });
        const chipBox = (await chip.boundingBox())!;
        expect(intersects(chipBox, tabBox), 'DEMO 칩이 탭바와 겹친다').toBe(false);

        const heading = page.getByRole('heading', { level: 1 }).first();
        if (await heading.isVisible()) {
          expect(intersects(chipBox, (await heading.boundingBox())!), 'DEMO 칩이 페이지 제목과 겹친다').toBe(false);
        }

        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(300);
        const contentBottom = await page.evaluate(() => {
          const main = document.querySelector('main');
          const last = main?.lastElementChild as HTMLElement | null;
          return last ? last.getBoundingClientRect().bottom : 0;
        });
        expect(contentBottom, '마지막 콘텐츠가 탭바 아래로 들어간다').toBeLessThanOrEqual(tabBox.y + 1);
        await capture(page, testInfo, route, 'bottom');
      });
    }
  });

  for (const width of [1024, 1440]) {
    test(`데스크톱 ${width}px: 사이드바·가로 스크롤`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', '데스크톱 프로젝트 전용');
      await page.setViewportSize({ width, height: 900 });

      for (const route of ROUTES) {
        await test.step(route, async () => {
          await page.goto(route);
          await page.waitForLoadState('networkidle');
          await expect(page.getByRole('navigation', { name: '사이드 메뉴' })).toBeVisible();
          await expect(page.getByRole('navigation', { name: '주요 메뉴' })).toBeHidden();
          await expectNoHorizontalScroll(page);
          await capture(page, testInfo, route, `w${width}`);
        });
      }
    });
  }
});
