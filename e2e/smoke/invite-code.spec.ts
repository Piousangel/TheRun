import { test, expect } from '@playwright/test';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

// 모바일·데스크톱 두 프로젝트에서 모두 돈다(D-18). 한쪽 skip 금지.
test.describe('초대 코드 — 관리자 발급', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  test('멤버 상세에서 코드를 만들면 RUN-XXXX-XXXX가 보이고 새로고침 뒤에도 화면이 복원된다', async ({ page }) => {
    await page.goto('/members/m-10');
    await page.getByRole('button', { name: '초대 코드 만들기' }).click();
    await expect(page.getByTestId('issued-invite-code')).toHaveText(/^RUN-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    await page.reload();
    await expect(page.getByRole('button', { name: '초대 코드 만들기' })).toBeVisible();
  });
});

test.describe('초대 코드 — 연결 화면', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'member.json') });

  test('이미 멤버가 연결된 계정은 /join에서 안내를 본다', async ({ page }) => {
    await page.goto('/join');
    await expect(page.getByText('이미').first()).toBeVisible();
    await expect(page.getByRole('button', { name: '홈으로 가기' })).toBeVisible();
  });

  test('비로그인은 /login으로 보낸다', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto('/join');
    await expect(page).toHaveURL(/\/login\?next=%2Fjoin/);
    await context.close();
  });
});
