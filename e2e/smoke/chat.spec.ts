import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

// S3 채팅 v1(launch.md 11월 스프린트, 스펙 §4, D-11): 클럽 채널 + 리그 팀 채널, 텍스트·안 읽음 수·이전 메시지.
// 모바일: 채널 목록 → 대화(?channel=), 입력창은 탭바 위 고정. 데스크톱: 목록 + 대화 2단.
// 모바일·데스크톱 두 프로젝트에서 모두 돈다(D-18). 한쪽 skip 금지.

/** 대화 영역(메시지 목록). 데스크톱은 오른쪽 패널, 모바일은 화면 전체 */
const messages = (page: Page) => page.getByRole('list', { name: '메시지' });
const input = (page: Page) => page.getByRole('textbox', { name: /메시지 입력/ });

test.describe('채팅 v1 — 멤버', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'member.json') });

  test('안 읽음 수가 보이고, 채널을 열어 보내면 남고, 새로고침·딥링크·뒤로가기가 같은 화면을 복원한다', async ({ page }, testInfo) => {
    const isDesktop = testInfo.project.name === 'desktop';
    const body = `e2e 채팅 ${testInfo.project.name} ${Date.now()}`;

    // 더보기(모바일) / 사이드바(데스크톱)에서 채팅으로 들어간다
    if (isDesktop) {
      await page.goto('/dashboard');
      await page.getByRole('navigation', { name: '사이드 메뉴' }).getByRole('link', { name: '채팅' }).click();
    } else {
      await page.goto('/more');
      await page.getByRole('link', { name: '채팅' }).click();
    }
    await expect(page).toHaveURL(/\/chat$/);

    const list = page.getByRole('list', { name: '채널 목록' });
    const club = list.getByRole('button', { name: /더런 전체/ });
    // 시드: 다른 회원 5명이 클럽 채널에 쓴 글 → 안 읽음 5
    if (isDesktop) {
      // 데스크톱은 들어오자마자 클럽 채널이 열려 바로 읽음 처리된다
      await expect(club).toHaveAttribute('aria-current', 'page');
      await expect(messages(page).getByText('공은 제가 챙겨 갈게요')).toBeVisible();
      await expect(club).toHaveAccessibleName('더런 전체');
    } else {
      await expect(club).toHaveAccessibleName('더런 전체, 안 읽음 5');
      await expect(club).toContainText('박도윤: 내일 비 소식 있던데');
      const box = await club.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      await club.click();
      await expect(page).toHaveURL(/\/chat\?channel=club$/);
      await expect(messages(page).getByText('공은 제가 챙겨 갈게요')).toBeVisible();
      // 상단바 제목이 채널 이름
      await expect(page.locator('header:visible').first().getByText('더런 전체')).toBeVisible();
    }

    // 보내기: Enter. 입력창이 비고, 내 메시지가 오른쪽(나)에 남는다
    const send = page.getByRole('button', { name: '보내기' });
    await expect(send).toBeDisabled();
    const sendBox = await send.boundingBox();
    expect(sendBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    await input(page).fill(body);
    await input(page).press('Enter');
    await expect(input(page)).toHaveValue('');
    const mine = messages(page).getByRole('listitem', { name: /^나 / }).filter({ hasText: body });
    await expect(mine).toBeVisible();
    // 모바일: 입력창(탭바 위 고정)에 가리지 않고 화면 안에 보인다
    await expect(mine).toBeInViewport();
    await expect(input(page)).toBeInViewport();

    // Shift+Enter는 줄바꿈(보내지 않는다)
    await input(page).fill('첫 줄');
    await input(page).press('Shift+Enter');
    await expect(input(page)).toHaveValue('첫 줄\n');
    await input(page).fill('');

    // 새로고침 → 같은 채널, 메시지 유지
    await page.reload();
    await expect(messages(page).getByText(body)).toBeVisible();

    if (!isDesktop) {
      // 뒤로가기 → 목록, 이제 안 읽음 없음
      await page.goBack();
      await expect(page).toHaveURL(/\/chat$/);
      await expect(club).toHaveAccessibleName('더런 전체');
      await expect(club).toContainText(`김민준: ${body}`);
    }

    // 딥링크
    await page.goto('/chat?channel=club');
    await expect(messages(page).getByText(body)).toBeVisible();
    // 없는(또는 남의 팀) 채널
    await page.goto('/chat?channel=team:nope');
    await expect(page.getByText('채널을 찾을 수 없어요')).toBeVisible();
  });

  test('다른 탭에서 보낸 메시지가 몇 초 안에 열린 대화에 나타난다(데모 동기화)', async ({ page, context }, testInfo) => {
    const body = `다른 탭 ${testInfo.project.name} ${Date.now()}`;
    await page.goto('/chat?channel=club');
    await expect(messages(page).getByText('공은 제가 챙겨 갈게요')).toBeVisible();

    const other = await context.newPage();
    await other.goto('/chat?channel=club');
    await input(other).fill(body);
    await other.getByRole('button', { name: '보내기' }).click();
    await expect(messages(other).getByText(body)).toBeVisible();
    await other.close();

    await expect(messages(page).getByText(body)).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('채팅 v1 — 리그 팀 채널', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  test('시즌에 팀을 만들면 팀 채널이 생기고, 팀 채널에 쓴 글은 그 채널에만 남는다', async ({ page }, testInfo) => {
    const isDesktop = testInfo.project.name === 'desktop';
    const season = `e2e 채팅 시즌 ${testInfo.project.name}`;
    const body = `팀 채널 ${Date.now()}`;

    await page.goto('/chat');
    await expect(page.getByText('리그 팀이 정해지면(팀장·드래프트) 팀 채널이 자동으로 생겨요.')).toBeVisible();

    // 시즌 + 팀(팀장 = 이서준, 운영진 계정 본인)
    await page.goto('/seasons?sheet=new');
    const createForm = page.getByRole('form', { name: '시즌 만들기' });
    await createForm.getByLabel('시즌 이름').fill(season);
    await createForm.getByRole('button', { name: '시즌 만들기' }).click();
    await expect(page.getByRole('heading', { name: season, level: 2 })).toBeVisible();
    await page.getByRole('article').getByRole('button', { name: '팀 추가' }).click();
    const teamForm = page.getByRole('form', { name: '팀 만들기' });
    await teamForm.getByLabel('팀장').selectOption({ label: '이서준' });
    await teamForm.getByRole('button', { name: '팀 만들기' }).click();
    await expect(teamForm).toBeHidden();

    await page.goto('/chat');
    const list = page.getByRole('list', { name: '채널 목록' });
    const team = list.getByRole('button', { name: /^A팀/ });
    await expect(team).toContainText(season);
    await team.click();
    await expect(page).toHaveURL(/\/chat\?channel=team%3A|\/chat\?channel=team:/);
    if (isDesktop) await expect(page.getByRole('heading', { name: 'A팀', level: 2 })).toBeVisible();
    else await expect(page.locator('header:visible').first().getByText('A팀')).toBeVisible();
    await expect(page.getByText('첫 메시지를 남겨 보세요')).toBeVisible();

    await input(page).fill(body);
    await input(page).press('Enter');
    await expect(messages(page).getByText(body)).toBeVisible();

    // 클럽 채널에는 없다
    await page.goto('/chat?channel=club');
    await expect(messages(page).getByText('공은 제가 챙겨 갈게요')).toBeVisible();
    await expect(messages(page).getByText(body)).toHaveCount(0);
  });
});
