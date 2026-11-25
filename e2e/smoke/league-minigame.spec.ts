import { test, expect } from '@playwright/test';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

// S1·S2 미니게임(스펙 §2.1-1): 종목·등수별 승점 설정 → 결과 입력 → 순위표 '미니게임 승점' + 합계.
// 모바일·데스크톱 두 프로젝트에서 모두 돈다(D-18). 모바일은 시트, 데스크톱은 목록 위 패널·표.
test.describe('리그 미니게임', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  test('종목을 추가하고 결과를 입력하면 순위표에 미니게임 승점이 더해지고, 딥링크·뒤로가기가 시트를 복원한다', async ({ page }, testInfo) => {
    const isDesktop = testInfo.project.name === 'desktop';
    const name = `e2e 미니게임 ${testInfo.project.name}`;

    await page.goto('/seasons?sheet=new');
    const createForm = page.getByRole('form', { name: '시즌 만들기' });
    await createForm.getByLabel('시즌 이름').fill(name);
    await createForm.getByRole('button', { name: '시즌 만들기' }).click();
    await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
    const detail = page.getByRole('article');
    for (let i = 0; i < 2; i += 1) {
      await detail.getByRole('button', { name: '팀 추가' }).click();
      const form = page.getByRole('form', { name: '팀 만들기' });
      await form.getByRole('button', { name: '팀 만들기' }).click();
      await expect(form).toBeHidden();
    }
    await detail.getByRole('button', { name: '일정 자동 생성' }).click();
    await expect(detail.getByRole('link', { name: /1경기/ }).first()).toBeVisible();

    // 미니게임이 없으면 순위표에 미니게임 칸이 없다
    await expect(detail.getByText('아직 미니게임이 없어요')).toBeVisible();
    const standings = detail.getByRole('table', { name: '시즌 순위' });
    await expect(standings.getByRole('columnheader', { name: /미니/ })).toHaveCount(0);

    // 종목 추가: 우승 2점, 2위 1점, 1주차
    await detail.getByRole('button', { name: '미니게임 추가' }).click();
    await expect(page).toHaveURL(/[?&]minigame=new/);
    const addForm = page.getByRole('form', { name: '미니게임 추가' });
    await addForm.getByLabel('종목').fill('승부차기');
    await addForm.getByLabel('경기일 (선택)').selectOption({ index: 1 });
    await addForm.getByLabel('우승').fill('2');
    await addForm.getByLabel('2위').fill('1');
    await addForm.getByRole('button', { name: '미니게임 추가' }).click();
    await expect(addForm).toBeHidden();
    await expect(page).not.toHaveURL(/minigame=/);
    await expect(detail.getByText('우승 2점 · 2위 1점')).toBeVisible();
    await expect(detail.getByText('결과 없음')).toBeVisible();

    // 결과 입력 열기 — URL에 남아 새로고침(딥링크)해도 같은 화면이 열린다
    if (isDesktop) await detail.getByRole('button', { name: '결과 입력' }).click();
    else await detail.getByRole('button', { name: '승부차기 결과 입력' }).click();
    await expect(page).toHaveURL(/[?&]minigame=(?!new)[^&]+/);
    await page.reload();
    const resultForm = page.getByRole('form', { name: '승부차기 결과' });
    await expect(resultForm).toBeVisible();
    if (!isDesktop) await expect(page.getByRole('dialog')).toBeVisible();

    await resultForm.getByRole('radiogroup', { name: 'B팀 등수' }).getByRole('radio', { name: /1위/ }).click();
    await resultForm.getByRole('radiogroup', { name: 'A팀 등수' }).getByRole('radio', { name: /2위/ }).click();
    await resultForm.getByRole('button', { name: '결과 저장' }).click();
    await expect(resultForm).toBeHidden();
    await expect(detail.getByText('1위 B팀 · 2위 A팀')).toBeVisible();

    // 순위표: 경기 없이 미니게임만으로 B팀 2점 > A팀 1점, 미니게임 칸과 합계
    await expect(standings.getByRole('columnheader', { name: isDesktop ? '미니게임' : '미니' })).toBeVisible();
    const first = standings.getByRole('row').nth(1);
    await expect(first.getByRole('rowheader')).toHaveText('B팀');
    await expect(first.getByRole('cell').last()).toHaveText('2');
    await expect(standings.getByRole('row').nth(2).getByRole('cell').last()).toHaveText('1');
    if (isDesktop) await expect(standings.getByRole('columnheader', { name: '경기 승점' })).toBeVisible();

    // 다시 열었다가 뒤로가기로 닫힌다(시트·패널 모두 URL 상태)
    if (isDesktop) await detail.getByRole('button', { name: '결과 수정' }).click();
    else await detail.getByRole('button', { name: '승부차기 결과 입력' }).click();
    await expect(page.getByRole('form', { name: '승부차기 결과' })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('form', { name: '승부차기 결과' })).toHaveCount(0);
    await expect(page).not.toHaveURL(/minigame=/);
  });
});
