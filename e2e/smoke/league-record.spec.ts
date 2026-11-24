import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

// S2 경기 기록. 모바일·데스크톱 두 프로젝트에서 모두 돈다(D-18). 한쪽 skip 금지.
// 모바일: 하단 고정 [팀 골] 버튼 → 시트(?goal=) / 데스크톱: 오른쪽 상시 기록 패널 + 숫자 키 쿼터 전환.
test.describe('리그 경기 기록 — 골·순위', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  async function seasonWithSchedule(page: Page, name: string) {
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
    return detail;
  }

  test('경기를 시작해 쿼터별로 골·도움을 기록하고, 지우고, 끝내면 순위에 반영된다', async ({ page }, testInfo) => {
    const isDesktop = testInfo.project.name === 'desktop';
    const name = `e2e 기록 ${testInfo.project.name}`;
    const detail = await seasonWithSchedule(page, name);

    // 경기 전에는 순위가 모두 0점
    await expect(detail.getByRole('table', { name: '시즌 순위' })).toBeVisible();

    await detail.getByRole('link', { name: /1경기/ }).first().click();
    await expect(page).toHaveURL(/\/seasons\/[^/]+\/fixtures\/[^/?]+/);
    const heading = page.getByRole('heading', { level: 2, name: / vs / });
    await expect(heading).toBeVisible();
    const [home, away] = (await heading.innerText()).split(' vs ');

    // 시작 전에는 기록 버튼이 없다
    await expect(page.getByRole('button', { name: `${home} 골` })).toHaveCount(0);
    await page.getByRole('button', { name: '경기 시작' }).click();
    await expect(page.getByText('진행 중').first()).toBeVisible();

    const score = page.getByRole('region', { name: '점수' }).locator('p[aria-label]');

    async function recordGoal(team: string, scorer: string, assist: string | null) {
      let scope;
      if (isDesktop) {
        scope = page.getByRole('complementary', { name: '기록 패널' });
        await scope.getByRole('button', { name: team, exact: true }).click();
      } else {
        await page.getByRole('button', { name: `${team} 골` }).click();
        await expect(page).toHaveURL(/[?&]goal=/);
        scope = page.getByRole('dialog');
        await expect(scope).toBeVisible();
      }
      await scope.getByRole('list', { name: '득점자 고르기' }).getByRole('button', { name: scorer, exact: true }).click();
      if (assist) await scope.getByRole('list', { name: '도움 고르기' }).getByRole('button', { name: assist, exact: true }).click();
      else await scope.getByRole('button', { name: '도움 없음으로 저장' }).click();
      if (!isDesktop) {
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(page).not.toHaveURL(/goal=/);
      }
    }

    // 1쿼터: 홈 골(도움 포함)
    await recordGoal(home, '김민준', '이서준');
    await expect(score).toHaveAttribute('aria-label', `${home} 1 대 ${away} 0`);
    await expect(page.getByRole('list', { name: '골 기록' }).getByText('도움 이서준')).toBeVisible();

    // 2쿼터로 전환(데스크톱은 숫자 키, 모바일은 탭). 쿼터는 URL에 남아 새로고침에도 유지된다.
    if (isDesktop) await page.keyboard.press('2');
    else await page.getByRole('tab', { name: '2Q' }).click();
    await expect(page).toHaveURL(/[?&]q=2/);
    await page.reload();
    await expect(page.getByRole('tab', { name: '2Q' })).toHaveAttribute('aria-selected', 'true');

    await recordGoal(home, '박도윤', null);
    await recordGoal(away, '이서준', null);
    await expect(score).toHaveAttribute('aria-label', `${home} 2 대 ${away} 1`);
    await expect(page.getByRole('list', { name: '골 기록' }).getByText('2쿼터', { exact: true })).toBeVisible();

    // 원정 골을 지우면 점수가 바로 바뀐다
    await page.getByRole('button', { name: '이서준 골 지우기' }).click();
    await expect(score).toHaveAttribute('aria-label', `${home} 2 대 ${away} 0`);

    // 변경 이력: 기록 3 + 삭제 1
    await page.getByText('변경 이력 (4)').click();
    await expect(page.getByText(/삭제 · 2Q 이서준 골/)).toBeVisible();

    await page.getByRole('button', { name: '경기 종료' }).click();
    await expect(page.getByRole('button', { name: '기록 다시 열기' })).toBeVisible();
    await expect(page.getByRole('button', { name: `${home} 골` })).toHaveCount(0);

    // 시즌으로 돌아가면 결과·순위가 반영돼 있다
    await page.getByRole('link', { name }).click();
    const standings = page.getByRole('article').getByRole('table', { name: '시즌 순위' });
    const firstRow = standings.getByRole('row').nth(1);
    await expect(firstRow.getByRole('rowheader')).toHaveText(home);
    await expect(firstRow.getByRole('cell').last()).toHaveText('3');
    await expect(page.getByRole('article').getByRole('link', { name: /2:0/ })).toBeVisible();
  });
});

test.describe('리그 경기 기록 — 멤버', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'member.json') });

  test('팀장이 아닌 멤버는 경기 시작·골 기록 버튼을 보지 못한다', async ({ page }) => {
    await page.goto('/seasons/없는시즌/fixtures/없는경기');
    await expect(page.getByText(/경기를 (찾을 수 없어요|불러오지 못했어요)/)).toBeVisible();
    await expect(page.getByRole('button', { name: '경기 시작' })).toHaveCount(0);
  });
});
