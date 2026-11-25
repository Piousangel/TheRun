import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

// S2 쿼터별 출전 명단 + 시즌 개인 기록. 모바일·데스크톱 두 프로젝트에서 모두 돈다(D-18). 한쪽 skip 금지.
// 모바일: 명단 버튼 → 하단 시트(?lineup=) / 데스크톱: 오른쪽 기록 패널이 명단 편집으로 바뀌고 Esc로 닫는다.
test.describe('리그 경기 기록 — 출전 명단·개인 기록', () => {
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

  test('쿼터 명단을 정하면 다음 쿼터 기본값이 되고, 득점자 후보 앞에 오며, 시즌 개인 기록에 쌓인다', async ({ page }, testInfo) => {
    const isDesktop = testInfo.project.name === 'desktop';
    const name = `e2e 명단 ${testInfo.project.name}`;
    const detail = await seasonWithSchedule(page, name);

    await detail.getByRole('link', { name: /1경기/ }).first().click();
    const heading = page.getByRole('heading', { level: 2, name: / vs / });
    await expect(heading).toBeVisible();
    const [home, away] = (await heading.innerText()).split(' vs ');
    await page.getByRole('button', { name: '경기 시작' }).click();
    await expect(page.getByText('진행 중').first()).toBeVisible();

    async function openLineup(team: string, quarter: number) {
      await page.getByRole('button', { name: `${team} ${quarter}쿼터 명단 편집` }).click();
      await expect(page).toHaveURL(/[?&]lineup=/);
      const form = page.getByRole('form', { name: `${team} ${quarter}쿼터 출전 명단` });
      await expect(form).toBeVisible();
      if (isDesktop) await expect(page.getByRole('complementary', { name: '기록 패널' }).getByRole('form')).toBeVisible();
      else await expect(page.getByRole('dialog')).toBeVisible();
      return form;
    }
    const chip = (form: ReturnType<Page['getByRole']>, member: string) =>
      form.getByRole('list', { name: '출전 선수 고르기' }).getByRole('button', { name: member, exact: true });
    async function save(form: ReturnType<Page['getByRole']>, count: number) {
      await form.getByRole('button', { name: `명단 저장 (${count}명)` }).click();
      await expect(form).toBeHidden();
      await expect(page).not.toHaveURL(/lineup=/);
    }
    const lineupRow = (quarter: number, team: string) => page.getByRole('list', { name: '출전 명단' }).getByRole('listitem', { name: `${quarter}쿼터 ${team} 명단` });

    // 1쿼터 홈 명단: 김민준·박도윤
    let form = await openLineup(home, 1);
    await chip(form, '김민준').click();
    await chip(form, '박도윤').click();
    await save(form, 2);
    await expect(lineupRow(1, home)).toContainText('김민준, 박도윤');

    // 같은 쿼터 상대 팀은 이미 홈 명단에 있는 선수를 고를 수 없다
    form = await openLineup(away, 1);
    await expect(chip(form, '김민준')).toBeDisabled();
    await chip(form, '이서준').click();
    await save(form, 1);

    // 득점자 후보는 이 쿼터 출전 선수가 앞에 온다
    if (isDesktop) {
      await page.getByRole('complementary', { name: '기록 패널' }).getByRole('button', { name: home, exact: true }).click();
    } else {
      await page.getByRole('button', { name: `${home} 골` }).click();
    }
    const goalScope = isDesktop ? page.getByRole('complementary', { name: '기록 패널' }) : page.getByRole('dialog');
    const scorers = goalScope.getByRole('list', { name: '득점자 고르기' }).getByRole('button');
    await expect(scorers.nth(0)).toHaveText('김민준');
    await expect(scorers.nth(1)).toHaveText('박도윤');
    await scorers.nth(0).click();
    await goalScope.getByRole('list', { name: '도움 고르기' }).getByRole('button', { name: '박도윤', exact: true }).click();
    if (!isDesktop) await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('region', { name: '점수' }).locator('p[aria-label]')).toHaveAttribute('aria-label', `${home} 1 대 ${away} 0`);

    // 2쿼터: 직전 쿼터 명단이 기본값으로 채워진다
    if (isDesktop) await page.keyboard.press('2');
    else await page.getByRole('tab', { name: '2Q' }).click();
    await expect(page).toHaveURL(/[?&]q=2/);
    await expect(lineupRow(2, home)).toContainText('명단 없음');
    form = await openLineup(home, 2);
    await expect(form.getByRole('status')).toContainText('1쿼터 명단을 불러왔어요');
    await expect(chip(form, '김민준')).toHaveAttribute('aria-pressed', 'true');
    await expect(chip(form, '박도윤')).toHaveAttribute('aria-pressed', 'true');

    // 딥링크: 새로고침해도 같은 명단 편집 화면이 열린다
    await page.reload();
    form = page.getByRole('form', { name: `${home} 2쿼터 출전 명단` });
    await expect(form).toBeVisible();
    await chip(form, '박도윤').click();
    await chip(form, '최예준').click();
    await save(form, 2);
    await expect(lineupRow(2, home)).toContainText('김민준, 최예준');

    // 데스크톱은 Esc로 명단 패널을 닫는다
    if (isDesktop) {
      await page.getByRole('button', { name: `${away} 2쿼터 명단 편집` }).click();
      await expect(page.getByRole('form', { name: `${away} 2쿼터 출전 명단` })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('form', { name: `${away} 2쿼터 출전 명단` })).toBeHidden();
      await expect(page).not.toHaveURL(/lineup=/);
    }

    // 변경 이력에 명단 변경이 남는다
    await page.getByText(/변경 이력 \(\d+\)/).click();
    await expect(page.getByText(new RegExp(`기록 · 2Q ${home} 출전 명단 2명`))).toBeVisible();

    // 경기를 끝내면 모든 쿼터 명단이 보인다
    await page.getByRole('button', { name: '경기 종료' }).click();
    await expect(page.getByRole('heading', { name: '쿼터별 출전 명단' })).toBeVisible();
    await expect(lineupRow(1, away)).toContainText('이서준');

    // 시즌 개인 기록: 김민준 2쿼터 출전·1골, 박도윤 1도움
    await page.getByRole('link', { name }).click();
    const article = page.getByRole('article');
    if (isDesktop) {
      const table = article.getByRole('table', { name: '개인 기록' });
      const kim = table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: '김민준' }) });
      await expect(kim.getByRole('cell')).toHaveText(['1', '2', '1', '0', '1']);
      const park = table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: '박도윤' }) });
      await expect(park.getByRole('cell')).toHaveText(['1', '1', '0', '1', '1']);
    } else {
      await expect(article.getByRole('region', { name: '득점 순위' }).getByRole('listitem').first()).toContainText('김민준');
      await expect(article.getByRole('region', { name: '득점 순위' })).toContainText('1골');
      await expect(article.getByRole('region', { name: '도움 순위' }).getByRole('listitem').first()).toContainText('박도윤');
    }
  });
});
