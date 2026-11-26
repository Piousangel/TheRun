import { test, expect, type Locator } from '@playwright/test';
import { addWeeks, format, previousSaturday, subWeeks } from 'date-fns';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

// S2 완료 조건(launch.md 11월 스프린트): 3경기 9쿼터 데모 기록 → 순위·개인 기록이 손으로 계산한 값과 일치.
// + 시즌 출석왕: 시즌 경기일을 시드 체크인이 있는 지난 4주 토요일로 잡으면 출석 순위가 쌓인다.
// 모바일·데스크톱 두 프로젝트에서 모두 돈다(D-18). 한쪽 skip 금지.

/** 시드(seed.ts)는 지난 4주 토요일에 체크인을 만든다. 같은 방식으로 가장 오래된 토요일을 구한다. */
const FIRST_SEEDED_SATURDAY = format(subWeeks(previousSaturday(new Date()), 3), 'yyyy-MM-dd');

/** 팀마다 고정 선수 2명. 쿼터마다 두 명 모두 출전한다(9쿼터 × 2팀). */
const ROSTER: Record<string, [string, string]> = {
  A팀: ['김민준', '최예준'],
  B팀: ['이서준', '정시우'],
  C팀: ['박도윤', '강하준'],
};

/** 경기별 골: [쿼터, 팀, 득점, 도움]. 팀 쌍으로 찾으므로 홈·원정 순서에 의존하지 않는다. */
type Goal = [quarter: number, team: string, scorer: string, assist: string | null];
const GOALS: Record<string, Goal[]> = {
  'A팀|B팀': [
    [1, 'A팀', '김민준', '최예준'],
    [2, 'B팀', '이서준', null],
    [3, 'A팀', '최예준', null],
  ], // A 2:1 B
  'A팀|C팀': [
    [1, 'C팀', '박도윤', '강하준'],
    [3, 'A팀', '김민준', null],
  ], // A 1:1 C
  'B팀|C팀': [
    [2, 'B팀', '정시우', '이서준'],
    [3, 'B팀', '이서준', null],
  ], // B 2:0 C
};

test.describe('S2 완료 조건 — 3경기 9쿼터 기록 → 순위·개인 기록·출석왕', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  test('한 경기일 3경기를 쿼터마다 명단·골까지 기록하면 순위·개인 기록이 계산값과 같고, 출석왕이 보인다', async ({ page }, testInfo) => {
    test.setTimeout(240_000);
    const isDesktop = testInfo.project.name === 'desktop';
    const name = `e2e 시즌 완주 ${testInfo.project.name}`;

    await page.goto('/seasons?sheet=new');
    const createForm = page.getByRole('form', { name: '시즌 만들기' });
    await createForm.getByLabel('시즌 이름').fill(name);
    await createForm.getByRole('button', { name: '시즌 만들기' }).click();
    await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
    const detail = page.getByRole('article');
    for (let i = 0; i < 3; i += 1) {
      await detail.getByRole('button', { name: '팀 추가' }).click();
      const form = page.getByRole('form', { name: '팀 만들기' });
      await form.getByRole('button', { name: '팀 만들기' }).click();
      await expect(form).toBeHidden();
    }
    await detail.getByLabel('첫 경기일').fill(FIRST_SEEDED_SATURDAY);
    await detail.getByRole('button', { name: '일정 자동 생성' }).click();
    await expect(detail.getByRole('link', { name: /^3경기/ }).first()).toBeVisible();

    const chip = (form: Locator, member: string) =>
      form.getByRole('list', { name: '출전 선수 고르기' }).getByRole('button', { name: member, exact: true });

    async function setLineup(team: string, quarter: number) {
      await page.getByRole('button', { name: `${team} ${quarter}쿼터 명단 편집` }).click();
      const form = page.getByRole('form', { name: `${team} ${quarter}쿼터 출전 명단` });
      await expect(form).toBeVisible();
      for (const member of ROSTER[team]) {
        // 2쿼터부터는 직전 쿼터 명단이 기본값으로 이미 골라져 있다
        if ((await chip(form, member).getAttribute('aria-pressed')) !== 'true') await chip(form, member).click();
      }
      await form.getByRole('button', { name: '명단 저장 (2명)' }).click();
      await expect(form).toBeHidden();
      await expect(page).not.toHaveURL(/lineup=/);
    }

    async function recordGoal(team: string, scorer: string, assist: string | null) {
      let scope: Locator;
      if (isDesktop) {
        scope = page.getByRole('complementary', { name: '기록 패널' });
        await scope.getByRole('button', { name: team, exact: true }).click();
      } else {
        await page.getByRole('button', { name: `${team} 골` }).click();
        scope = page.getByRole('dialog');
        await expect(scope).toBeVisible();
      }
      await scope.getByRole('list', { name: '득점자 고르기' }).getByRole('button', { name: scorer, exact: true }).click();
      if (assist) await scope.getByRole('list', { name: '도움 고르기' }).getByRole('button', { name: assist, exact: true }).click();
      else await scope.getByRole('button', { name: '도움 없음으로 저장' }).click();
      if (!isDesktop) await expect(page.getByRole('dialog')).toHaveCount(0);
    }

    async function playFixture(order: number) {
      await detail.getByRole('link', { name: new RegExp(`^${order}경기`) }).first().click();
      const heading = page.getByRole('heading', { level: 2, name: / vs / });
      await expect(heading).toBeVisible();
      const [home, away] = (await heading.innerText()).split(' vs ');
      const goals = GOALS[[home, away].sort().join('|')];
      expect(goals, `${home} vs ${away} 경기 계획`).toBeDefined();

      await page.getByRole('button', { name: '경기 시작' }).click();
      await expect(page.getByText('진행 중').first()).toBeVisible();
      const score = page.getByRole('region', { name: '점수' }).locator('p[aria-label]');
      const tally: Record<string, number> = { [home]: 0, [away]: 0 };

      for (let q = 1; q <= 3; q += 1) {
        if (q > 1) {
          if (isDesktop) await page.keyboard.press(String(q));
          else await page.getByRole('tab', { name: `${q}Q` }).click();
          await expect(page).toHaveURL(new RegExp(`[?&]q=${q}`));
        }
        await setLineup(home, q);
        await setLineup(away, q);
        for (const [quarter, team, scorer, assist] of goals) {
          if (quarter !== q) continue;
          await recordGoal(team, scorer, assist);
          tally[team] += 1;
          await expect(score).toHaveAttribute('aria-label', `${home} ${tally[home]} 대 ${away} ${tally[away]}`);
        }
      }

      await page.getByRole('button', { name: '경기 종료' }).click();
      await expect(page.getByRole('button', { name: '기록 다시 열기' })).toBeVisible();
      await page.getByRole('link', { name }).click();
      await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
    }

    for (const order of [1, 2, 3]) await playFixture(order);

    // 새로고침(딥링크)해도 계산 결과는 같다 — 순위·기록은 저장값이 아니라 이벤트에서 계산된다
    await page.reload();
    await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();

    // 순위: A 1승1무 4점 > B 1승1패 3점 > C 1무1패 1점
    const standings = detail.getByRole('table', { name: '시즌 순위' });
    const expected: [string, string][] = [
      ['A팀', '4'],
      ['B팀', '3'],
      ['C팀', '1'],
    ];
    for (const [i, [team, points]] of expected.entries()) {
      const row = standings.getByRole('row').nth(i + 1);
      await expect(row.getByRole('rowheader')).toHaveText(team);
      await expect(row.getByRole('cell').nth(1)).toHaveText('2'); // 경기 수
      await expect(row.getByRole('cell').last()).toHaveText(points);
    }
    // 1주차 3경기 결과가 일정에 남는다
    await expect(detail.getByRole('link', { name: /2:1|1:2/ })).toBeVisible();
    await expect(detail.getByRole('link', { name: /1:1/ })).toBeVisible();
    await expect(detail.getByRole('link', { name: /2:0|0:2/ })).toBeVisible();

    // 개인 기록: 선수마다 2경기 × 3쿼터 = 6쿼터 출전
    if (isDesktop) {
      const table = detail.getByRole('table', { name: '개인 기록' });
      const cells = (player: string) => table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: player }) }).getByRole('cell');
      // [순위, 출전 쿼터, 골, 도움, 공격포인트]
      await expect(cells('이서준')).toHaveText(['1', '6', '2', '1', '3']);
      await expect(cells('김민준')).toHaveText(['2', '6', '2', '0', '2']);
      await expect(cells('최예준')).toHaveText(['2', '6', '1', '1', '2']);
      await expect(cells('강하준')).toHaveText(['4', '6', '0', '1', '1']);
      await expect(cells('박도윤')).toHaveText(['4', '6', '1', '0', '1']);
      await expect(cells('정시우')).toHaveText(['4', '6', '1', '0', '1']);
      await expect(table.getByRole('row')).toHaveCount(7);
    } else {
      const scorers = detail.getByRole('region', { name: '득점 순위' }).getByRole('listitem');
      await expect(scorers).toHaveCount(3);
      await expect(scorers.nth(0)).toContainText('김민준');
      await expect(scorers.nth(0)).toContainText('2골');
      await expect(scorers.nth(1)).toContainText('이서준');
      await expect(scorers.nth(2)).toContainText('박도윤');
      await expect(scorers.nth(2)).toContainText('1골');
      const assists = detail.getByRole('region', { name: '도움 순위' }).getByRole('listitem');
      await expect(assists).toHaveText([/강하준/, /이서준/, /최예준/]);
    }

    // 출석왕: 시드 체크인(지난 4주) — 정시우 4연속 정시, 최예준 정시 3·지각 1, 박도윤 정시 3(마지막 주 없음)
    if (isDesktop) {
      const king = detail.getByRole('table', { name: '출석왕' });
      const row = (i: number) => king.getByRole('row').nth(i);
      // [순위, 정시, 지각, 출석률, 연속 정시, 최고 연속]
      await expect(row(1).getByRole('rowheader')).toHaveText('정시우');
      await expect(row(1).getByRole('cell')).toHaveText(['1', '4', '0', '100%', '4', '4']);
      await expect(row(2).getByRole('rowheader')).toHaveText('최예준');
      await expect(row(2).getByRole('cell')).toHaveText(['2', '3', '1', '100%', '1', '2']);
      await expect(row(3).getByRole('rowheader')).toHaveText('박도윤');
      await expect(row(3).getByRole('cell')).toHaveText(['3', '3', '0', '75%', '0', '3']);
    } else {
      const king = detail.getByRole('list', { name: '출석왕' }).getByRole('listitem');
      await expect(king).toHaveCount(5);
      await expect(king.nth(0)).toContainText('정시우');
      await expect(king.nth(0)).toContainText('정시 4/4');
      await expect(king.nth(0)).toContainText('4연속');
      await expect(king.nth(1)).toContainText('최예준');
      await expect(king.nth(2)).toContainText('박도윤');
    }
  });
});

test.describe('출석왕 — 경기일 전', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  test('경기일이 아직 오지 않은 시즌은 출석 순위 대신 안내를 보여준다', async ({ page }, testInfo) => {
    const name = `e2e 출석 대기 ${testInfo.project.name}`;
    await page.goto('/seasons?sheet=new');
    const createForm = page.getByRole('form', { name: '시즌 만들기' });
    await createForm.getByLabel('시즌 이름').fill(name);
    await createForm.getByRole('button', { name: '시즌 만들기' }).click();
    const detail = page.getByRole('article');
    for (let i = 0; i < 2; i += 1) {
      await detail.getByRole('button', { name: '팀 추가' }).click();
      const form = page.getByRole('form', { name: '팀 만들기' });
      await form.getByRole('button', { name: '팀 만들기' }).click();
      await expect(form).toBeHidden();
    }
    await detail.getByLabel('첫 경기일').fill(format(addWeeks(new Date(), 2), 'yyyy-MM-dd'));
    await detail.getByRole('button', { name: '일정 자동 생성' }).click();
    await expect(detail.getByRole('link', { name: /1경기/ }).first()).toBeVisible();
    await expect(detail.getByRole('heading', { name: '출석왕' })).toBeVisible();
    await expect(detail.getByText('첫 경기일이 지나면 출석 순위가 쌓여요.')).toBeVisible();
  });
});
