import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

// S1 실시간 스네이크 드래프트(스펙 §2.1): 순서 추첨 → 차례인 팀이 선수 카드에서 뽑기 → 다른 탭에 반영 → 되돌리기·끝내기.
// 모바일·데스크톱 두 프로젝트에서 모두 돈다(D-18). 모바일은 선수 목록·팀 탭 + 시트, 데스크톱은 선수 표 + 팀 보드 + 패널.
test.describe('리그 드래프트', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  test('추첨한 순서대로 스네이크 픽을 하고, 다른 탭에 픽이 보이며, 딥링크·뒤로가기·되돌리기·끝내기가 동작한다', async ({ page, context }, testInfo) => {
    const isDesktop = testInfo.project.name === 'desktop';
    const name = `e2e 드래프트 ${testInfo.project.name}`;

    await page.goto('/seasons?sheet=new');
    const createForm = page.getByRole('form', { name: '시즌 만들기' });
    await createForm.getByLabel('시즌 이름').fill(name);
    await createForm.getByRole('button', { name: '시즌 만들기' }).click();
    await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
    const detail = page.getByRole('article');
    // A팀 팀장 = 이서준(운영진 계정 본인), B팀 팀장 = 김민준
    for (const captain of ['이서준', '김민준']) {
      await detail.getByRole('button', { name: '팀 추가' }).click();
      const form = page.getByRole('form', { name: '팀 만들기' });
      await form.getByLabel('팀장').selectOption({ label: captain });
      await form.getByRole('button', { name: '팀 만들기' }).click();
      await expect(form).toBeHidden();
    }

    // 시즌 상세 → 드래프트(시작 전)
    const entry = detail.getByRole('link', { name: '드래프트' });
    await expect(entry).toContainText('시작 전');
    await entry.click();
    await expect(page).toHaveURL(/\/seasons\/[^/]+\/draft/);
    const draftUrl = page.url();
    const board = page.getByRole('article', { name: '드래프트' });
    await expect(board.getByRole('heading', { name: '드래프트' })).toBeVisible();

    await board.getByRole('button', { name: '순서 추첨하고 시작' }).click();
    const clock = board.getByRole('region', { name: '지금 차례' });
    await expect(clock).toContainText('1라운드 · 1번째 픽');
    // 배너: '… B팀 차례 다음: …' 또는 '… 내 차례예요 · A팀 다음: …' — '다음' 앞의 팀이 지금 차례
    const first = /([AB]팀)(?: 차례)?다음/.exec((await clock.textContent()) ?? '')?.[1] ?? 'A팀';
    const second = first === 'A팀' ? 'B팀' : 'A팀';
    // 내가 A팀 팀장이므로 A팀 차례면 '내 차례예요'
    if (first === 'A팀') await expect(clock).toContainText('내 차례예요 · A팀');
    else await expect(clock).toContainText('B팀 차례');
    // 팀장은 뽑을 대상이 아니다
    await expect(board.getByRole('button', { name: '이서준 선수 카드' })).toHaveCount(0);
    await expect(board.getByRole('button', { name: '김민준 선수 카드' })).toHaveCount(0);

    // 두 번째 탭(다른 기기 대신)
    const other = await context.newPage();
    await other.goto(draftUrl);
    const otherBoard = other.getByRole('article', { name: '드래프트' });
    await expect(otherBoard.getByText('0픽')).toBeVisible();

    const pickTop = async (p: Page, team: string) => {
      const art = p.getByRole('article', { name: '드래프트' });
      const card = art.getByRole('button', { name: / 선수 카드$/ }).first();
      const label = (await card.getAttribute('aria-label')) ?? '';
      const player = label.replace(/ 선수 카드$/, '');
      await card.click();
      await expect(p).toHaveURL(/[?&]pick=m-/);
      const form = p.getByRole('form', { name: `${player} 선수 카드` });
      await expect(form).toBeVisible();
      await form.getByRole('button', { name: `${team}에 뽑기` }).click();
      await expect(form).toBeHidden();
      await expect(p).not.toHaveURL(/pick=/);
      return player;
    };

    const p1 = await pickTop(page, first);
    await expect(clock).toContainText('1라운드 · 2번째 픽');
    await expect(clock).toContainText(second);
    // 다른 탭에도 몇 초 안에 반영된다
    await expect(otherBoard.getByText('1픽')).toBeVisible({ timeout: 10_000 });
    await expect(otherBoard.getByRole('region', { name: '지금 차례' })).toContainText(second);
    await other.close();

    // 스네이크: 2번째·3번째 픽은 같은 팀
    await pickTop(page, second);
    await expect(clock).toContainText('2라운드 · 3번째 픽');
    await expect(clock).toContainText(second);
    const p3 = await pickTop(page, second);

    // 팀 명단
    if (!isDesktop) await board.getByRole('tab', { name: '팀' }).click();
    await expect(board.getByRole('listitem', { name: `${first} 명단` })).toContainText(p1);
    await expect(board.getByRole('listitem', { name: `${second} 명단` })).toContainText(p3);
    if (!isDesktop) {
      await expect(page).toHaveURL(/[?&]tab=teams/);
      await board.getByRole('tab', { name: '선수' }).click();
    }

    // 선수 카드 딥링크: 새로고침해도 열리고, 뒤로가기로 닫힌다
    await board.getByRole('button', { name: / 선수 카드$/ }).first().click();
    await expect(page).toHaveURL(/[?&]pick=m-/);
    await page.reload();
    const card = page.getByRole('form', { name: / 선수 카드$/ });
    await expect(card).toBeVisible();
    if (!isDesktop) await expect(page.getByRole('dialog')).toBeVisible();
    await expect(card).toContainText('스탯 합');
    await expect(card).toContainText('참석 가능');
    await page.goBack();
    await expect(page.getByRole('form', { name: / 선수 카드$/ })).toHaveCount(0);

    // 운영진: 마지막 픽 되돌리기 → 4번째 픽 차례가 다시 3번째로
    await board.getByRole('button', { name: '마지막 픽 되돌리기' }).click();
    await expect(clock).toContainText('2라운드 · 3번째 픽');
    await expect(board.getByText('2픽')).toBeVisible();

    // 끝내기(확인 대화상자 수락)
    page.once('dialog', (dialog) => dialog.accept());
    await board.getByRole('button', { name: '드래프트 끝내기' }).click();
    await expect(clock).toContainText('드래프트가 끝났어요');
    await expect(board.getByRole('button', { name: '마지막 픽 되돌리기' })).toHaveCount(0);

    await board.getByRole('link', { name }).click();
    await expect(page.getByRole('article').getByRole('link', { name: '드래프트' })).toContainText('완료 · 2픽');
  });
});
