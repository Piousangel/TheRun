import { test, expect } from '@playwright/test';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

// S1 참석 가능 주차(스펙 §2.1): 본인 입력 → 운영진 대신 입력 → 주차별 인원·입력 현황.
// 모바일·데스크톱 두 프로젝트에서 모두 돈다(D-18). 모바일은 목록 → 시트, 데스크톱은 회원 × 주차 표 → 패널.
test.describe('리그 참석 가능 주차', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  test('본인이 주차를 저장하고, 운영진이 다른 회원을 대신 입력하며, 딥링크·뒤로가기가 편집 화면을 복원한다', async ({ page }, testInfo) => {
    const isDesktop = testInfo.project.name === 'desktop';
    const name = `e2e 참석 주차 ${testInfo.project.name}`;

    await page.goto('/seasons?sheet=new');
    const createForm = page.getByRole('form', { name: '시즌 만들기' });
    await createForm.getByLabel('시즌 이름').fill(name);
    await createForm.getByRole('button', { name: '시즌 만들기' }).click();
    await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
    const detail = page.getByRole('article');
    const section = detail.getByRole('region', { name: '참석 가능 주차' });
    await expect(section.getByLabel('입력 현황')).toHaveText(/입력 0\/\d+명/);

    // 본인(이서준, 운영진 계정과 연결된 회원): 1·3주차만 가능
    const mine = section.getByRole('form', { name: '내 참석 가능 주차' });
    await mine.getByRole('button', { name: /^1주차/ }).click();
    await mine.getByRole('button', { name: /^3주차/ }).click();
    await expect(mine.getByRole('button', { name: /^1주차/ })).toHaveAttribute('aria-pressed', 'true');
    await mine.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('참석 가능 2주를 저장했어요.')).toBeVisible();
    await expect(section.getByLabel('입력 현황')).toHaveText(/입력 1\/\d+명/);
    const perWeek = section.getByRole('list', { name: '주차별 참석 가능 인원' });
    await expect(perWeek.getByRole('listitem').nth(0)).toContainText('1명');
    await expect(perWeek.getByRole('listitem').nth(1)).toContainText('0명');

    // 새로고침해도 저장값이 남는다
    await page.reload();
    await expect(section.getByRole('form', { name: '내 참석 가능 주차' }).getByRole('button', { name: /^3주차/ })).toHaveAttribute('aria-pressed', 'true');

    // 운영진이 정시우를 대신 입력 — URL 상태라 새로고침(딥링크)해도 편집 화면이 열린다
    await section.getByRole('button', { name: '정시우 참석 가능 주차 수정' }).click();
    await expect(page).toHaveURL(/[?&]availability=m-05/);
    await page.reload();
    const other = page.getByRole('form', { name: '정시우 참석 가능 주차' });
    await expect(other).toBeVisible();
    if (!isDesktop) await expect(page.getByRole('dialog')).toBeVisible();
    await other.getByRole('button', { name: '전부 가능' }).click();
    await other.getByRole('button', { name: '저장' }).click();
    await expect(other).toBeHidden();
    await expect(page).not.toHaveURL(/availability=/);
    await expect(section.getByLabel('입력 현황')).toHaveText(/입력 2\/\d+명/);
    await expect(perWeek.getByRole('listitem').nth(0)).toContainText('2명');

    if (isDesktop) {
      const table = section.getByRole('table', { name: '회원별 참석 가능 주차' });
      const row = table.getByRole('row', { name: /정시우/ });
      await expect(row.getByRole('cell').filter({ hasText: /^\d+\/\d+$/ })).toHaveText(/^(\d+)\/\1$/);
      await expect(table.getByRole('row', { name: /이서준/ }).getByRole('cell').filter({ hasText: /^\d+\/\d+$/ })).toHaveText(/^2\/\d+$/);
    } else {
      const list = section.getByRole('list', { name: '회원별 참석 가능 주차' });
      await expect(list.getByRole('button', { name: '정시우 참석 가능 주차 수정' })).toContainText('전부 가능');
      await expect(list.getByRole('button', { name: '이서준 참석 가능 주차 수정' })).toContainText('1·3주');
    }

    // 다시 열었다가 뒤로가기로 닫힌다
    await section.getByRole('button', { name: '정시우 참석 가능 주차 수정' }).click();
    await expect(page.getByRole('form', { name: '정시우 참석 가능 주차' })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('form', { name: '정시우 참석 가능 주차' })).toHaveCount(0);
    await expect(page).not.toHaveURL(/availability=/);
  });
});
