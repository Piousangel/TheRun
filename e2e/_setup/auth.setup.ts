import { test as setup, expect } from '@playwright/test';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

const ACCOUNTS = [
  { file: 'member.json', button: '멤버로 체험하기' },
  { file: 'admin.json', button: '관리자로 체험하기' },
] as const;

// 스모크 스펙이 도는 라우트를 미리 한 번씩 방문해 Next dev 서버가 컴파일을 끝내둔다.
// 그렇게 하지 않으면 스펙에서 처음 방문하는 라우트가 컴파일되는 동안 webpack의
// Fast Refresh full-reload 신호가 도중의 page.goto를 가로채 "interrupted by another
// navigation"으로 실패하는 경우가 있었다(로컬 dev 서버 첫 컴파일에서 재현됨).
const ROUTES_TO_WARM = ['/votes', '/matches', '/members'];

for (const account of ACCOUNTS) {
  setup(`데모 로그인 저장: ${account.file}`, async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: account.button }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    for (const route of ROUTES_TO_WARM) {
      await page.goto(route);
    }

    await page.context().storageState({ path: path.join(STORAGE_DIR, account.file) });
  });
}
