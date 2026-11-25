import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

// S2 오프라인 큐(스펙 §2.3 "기록은 기기에 먼저 저장하고 연결되면 동기화한다. 화면에 '동기화 대기 N건'").
// 모바일·데스크톱 두 프로젝트에서 모두 돈다(D-18). 한쪽 skip 금지.
test.describe('리그 경기 기록 — 오프라인 큐', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  async function liveFixture(page: Page, name: string) {
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
    await detail.getByRole('link', { name: /1경기/ }).first().click();
    const heading = page.getByRole('heading', { level: 2, name: / vs / });
    await expect(heading).toBeVisible();
    const [home, away] = (await heading.innerText()).split(' vs ');
    await page.getByRole('button', { name: '경기 시작' }).click();
    await expect(page.getByText('진행 중').first()).toBeVisible();
    return { home, away };
  }

  test('연결이 끊긴 동안 기록한 골은 기기에 쌓여 점수에 바로 보이고, 연결되면 자동으로 보내진다', async ({ page, context }, testInfo) => {
    const isDesktop = testInfo.project.name === 'desktop';
    const { home, away } = await liveFixture(page, `e2e 오프라인 ${testInfo.project.name}`);
    const score = page.getByRole('region', { name: '점수' }).locator('p[aria-label]');
    const status = page.getByRole('status').filter({ hasText: /동기화 대기|오프라인/ });

    async function recordGoal(team: string, scorer: string) {
      let scope;
      if (isDesktop) {
        scope = page.getByRole('complementary', { name: '기록 패널' });
        await scope.getByRole('button', { name: team, exact: true }).click();
      } else {
        await page.getByRole('button', { name: `${team} 골` }).click();
        scope = page.getByRole('dialog');
        await expect(scope).toBeVisible();
      }
      await scope.getByRole('list', { name: '득점자 고르기' }).getByRole('button', { name: scorer, exact: true }).click();
      await scope.getByRole('button', { name: '도움 없음으로 저장' }).click();
      if (!isDesktop) await expect(page.getByRole('dialog')).toHaveCount(0);
    }

    // 연결이 있으면 상태 칸은 보이지 않는다
    await expect(status).toHaveCount(0);

    await context.setOffline(true);
    await expect(status).toContainText('오프라인');

    await recordGoal(home, '김민준');
    await recordGoal(away, '이서준');
    await expect(status).toContainText('동기화 대기 2건');
    await expect(score).toHaveAttribute('aria-label', `${home} 1 대 ${away} 1`);
    await expect(page.getByRole('list', { name: '골 기록' }).getByText('대기', { exact: true })).toHaveCount(2);

    // 보내기 전 기록은 지우면 큐에서 빠진다
    await page.getByRole('button', { name: '이서준 골 지우기' }).click();
    await expect(status).toContainText('동기화 대기 1건');
    await expect(score).toHaveAttribute('aria-label', `${home} 1 대 ${away} 0`);

    // 연결이 돌아오면 자동으로 보내고, 대기 표시가 사라진다. 점수는 그대로다(중복 없음).
    await context.setOffline(false);
    await expect(status).toHaveCount(0);
    await expect(page.getByRole('list', { name: '골 기록' }).getByText('대기', { exact: true })).toHaveCount(0);
    await expect(score).toHaveAttribute('aria-label', `${home} 1 대 ${away} 0`);

    // 서버(로컬 어댑터)에 실제로 들어갔다: 새로고침해도 남고, 변경 이력에 1건
    await page.reload();
    await expect(score).toHaveAttribute('aria-label', `${home} 1 대 ${away} 0`);
    await expect(page.getByText('변경 이력 (1)')).toBeVisible();
  });
});
