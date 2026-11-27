import { test, expect, type Page } from '@playwright/test';
import { addWeeks, format, nextSaturday } from 'date-fns';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

// S1 완료 조건(launch.md 11월 스프린트): 데모 시즌 하나로 시즌 → 팀장 → 드래프트 → 일정까지.
// 드래프트로 정해진 팀 명단(팀장 + 픽)이 경기 기록의 첫 쿼터 출전 명단 기본값으로 이어지는지까지 본다.
// 모바일·데스크톱 두 프로젝트에서 모두 돈다(D-18). 한쪽 skip 금지.

const FIRST_MATCHDAY = format(addWeeks(nextSaturday(new Date()), 1), 'yyyy-MM-dd');
const CAPTAINS: Record<string, string> = { A팀: '이서준', B팀: '김민준' };

test.describe('S1 완료 조건 — 시즌 → 드래프트 → 일정', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  test('드래프트를 끝내고 일정을 만들면, 첫 경기 출전 명단이 드래프트 팀 명단으로 채워진다', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    const isDesktop = testInfo.project.name === 'desktop';
    const name = `e2e S1 완주 ${testInfo.project.name}`;

    // 1) 시즌 + 팀 2개(팀장 지정)
    await page.goto('/seasons?sheet=new');
    const createForm = page.getByRole('form', { name: '시즌 만들기' });
    await createForm.getByLabel('시즌 이름').fill(name);
    await createForm.getByRole('button', { name: '시즌 만들기' }).click();
    await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
    const detail = page.getByRole('article');
    for (const captain of Object.values(CAPTAINS)) {
      await detail.getByRole('button', { name: '팀 추가' }).click();
      const form = page.getByRole('form', { name: '팀 만들기' });
      await form.getByLabel('팀장').selectOption({ label: captain });
      await form.getByRole('button', { name: '팀 만들기' }).click();
      await expect(form).toBeHidden();
    }

    // 2) 드래프트: 추첨 → 4픽(1-2-1 스네이크) → 끝내기
    await detail.getByRole('link', { name: '드래프트' }).click();
    const board = page.getByRole('article', { name: '드래프트' });
    await board.getByRole('button', { name: '순서 추첨하고 시작' }).click();
    const clock = board.getByRole('region', { name: '지금 차례' });
    await expect(clock).toContainText('1라운드 · 1번째 픽');

    const rosters: Record<string, string[]> = { A팀: [CAPTAINS.A팀], B팀: [CAPTAINS.B팀] };
    const pickTop = async (p: Page, pickNo: number) => {
      const text = (await clock.textContent()) ?? '';
      const team = /([AB]팀)(?: 차례)?다음/.exec(text)?.[1] ?? /([AB]팀)/.exec(text)?.[1];
      expect(team, `${pickNo}번째 픽 차례 팀`).toBeDefined();
      const card = board.getByRole('button', { name: / 선수 카드$/ }).first();
      const player = ((await card.getAttribute('aria-label')) ?? '').replace(/ 선수 카드$/, '');
      await card.click();
      const form = p.getByRole('form', { name: `${player} 선수 카드` });
      await form.getByRole('button', { name: `${team}에 뽑기` }).click();
      await expect(form).toBeHidden();
      rosters[team as string].push(player);
    };
    for (let i = 1; i <= 4; i += 1) {
      await expect(clock).toContainText(`${i}번째 픽`);
      await pickTop(page, i);
    }
    page.once('dialog', (dialog) => dialog.accept());
    await board.getByRole('button', { name: '드래프트 끝내기' }).click();
    await expect(clock).toContainText('드래프트가 끝났어요');
    expect(rosters.A팀).toHaveLength(3);
    expect(rosters.B팀).toHaveLength(3);

    // 3) 시즌 상세로 돌아와 일정 자동 생성
    await board.getByRole('link', { name }).click();
    await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
    await expect(detail.getByRole('link', { name: '드래프트' })).toContainText('완료 · 4픽');
    await detail.getByLabel('첫 경기일').fill(FIRST_MATCHDAY);
    await detail.getByRole('button', { name: '일정 자동 생성' }).click();
    const firstFixture = detail.getByRole('link', { name: /^1경기/ }).first();
    await expect(firstFixture).toBeVisible();

    // 4) 첫 경기 기록 → 출전 명단 편집: 드래프트 팀 명단이 기본값으로 골라져 있다
    await firstFixture.click();
    const heading = page.getByRole('heading', { level: 2, name: / vs / });
    await expect(heading).toBeVisible();
    const [home] = (await heading.innerText()).split(' vs ');
    await page.getByRole('button', { name: '경기 시작' }).click();
    await page.getByRole('button', { name: `${home} 1쿼터 명단 편집` }).click();
    await expect(page).toHaveURL(/[?&]lineup=/);
    const lineup = page.getByRole('form', { name: `${home} 1쿼터 출전 명단` });
    await expect(lineup).toBeVisible();
    if (!isDesktop) await expect(page.getByRole('dialog')).toBeVisible();
    await expect(lineup).toContainText('드래프트 팀 명단을 불러왔어요');
    const mine = lineup.getByRole('list', { name: `${home} 명단에서 고르기` });
    await expect(mine.getByRole('button')).toHaveCount(3);
    for (const player of rosters[home]) {
      await expect(mine.getByRole('button', { name: player, exact: true })).toHaveAttribute('aria-pressed', 'true');
    }
    // 상대 팀 선수는 '다른 회원'에 있고 골라져 있지 않다
    const away = home === 'A팀' ? 'B팀' : 'A팀';
    const others = lineup.getByRole('list', { name: '다른 회원 고르기' });
    await expect(others.getByRole('button', { name: rosters[away][1], exact: true })).toHaveAttribute('aria-pressed', 'false');

    // 새로고침(딥링크)해도 같은 명단 편집이 열린다
    await page.reload();
    await expect(page.getByRole('form', { name: `${home} 1쿼터 출전 명단` })).toBeVisible();
    await page.getByRole('form', { name: `${home} 1쿼터 출전 명단` }).getByRole('button', { name: '명단 저장 (3명)' }).click();
    await expect(page.getByRole('form', { name: `${home} 1쿼터 출전 명단` })).toBeHidden();
    await expect(page).not.toHaveURL(/lineup=/);
  });
});
