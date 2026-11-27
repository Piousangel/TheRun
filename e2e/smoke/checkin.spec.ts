import { test, expect, type Page } from '@playwright/test';
import { nextSaturday, set } from 'date-fns';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

// S1 출석 체크인 v1(launch.md 11월 스프린트, 스펙 §3): 경기일 05:30~08:00 홈 "도착했어요" → 06:30까지 정시, 뒤면 지각.
// 운영진은 체크인 명단에서 한 명씩 확정하고 미확인을 한 번에 결석 처리한다.
// 모바일·데스크톱 두 프로젝트에서 모두 돈다(D-18). 한쪽 skip 금지.

/** 시드(seed.ts)의 이번 주 경기 투표는 nextSaturday(now) 07:00(로컬). 그 날짜를 KST로 구한다. */
function seededMatchDayKst(): string {
  const at = set(nextSaturday(new Date()), { hours: 7, minutes: 0, seconds: 0, milliseconds: 0 });
  return new Date(at.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 실제 시각으로 시드를 저장한 뒤(경기 투표가 '다음 토요일'로 잡힌다) 시계를 그 경기일 KST hh:mm으로 옮긴다. */
async function goToMatchDay(page: Page, hhmm: string) {
  await page.goto('/votes');
  await expect(page.getByText(/정기 경기/).first()).toBeVisible();
  const day = seededMatchDayKst();
  await page.clock.setFixedTime(new Date(`${day}T${hhmm}:00+09:00`));
  await page.goto('/dashboard');
  return day;
}

test.describe('S1 출석 체크인 v1 — 멤버', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'member.json') });

  test('경기일 05:30 전에는 카드가 없고, 06:12에 "도착했어요"를 누르면 정시로 남는다', async ({ page }) => {
    await goToMatchDay(page, '05:10');
    await expect(page.getByText('오늘의 포커스')).toBeVisible();
    await expect(page.getByRole('region', { name: '오늘 경기 체크인' })).toHaveCount(0);

    await page.clock.setFixedTime(new Date(`${seededMatchDayKst()}T06:12:00+09:00`));
    await page.reload();
    const card = page.getByRole('region', { name: '오늘 경기 체크인' });
    await expect(card).toBeVisible();
    // 홈 최상단: 스크롤 없이 첫 화면에 보인다(모바일 390×844 포함)
    await expect(card).toBeInViewport();
    const button = card.getByRole('button', { name: '도착했어요' });
    const box = await button.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    await button.click();
    await expect(card.getByText('06:12 체크인')).toBeVisible();
    await expect(card.getByText('정시')).toBeVisible();
    await expect(card.getByRole('button', { name: '도착했어요' })).toHaveCount(0);
    // 멤버에게는 명단 링크가 없다
    await expect(card.getByRole('link', { name: '체크인 명단' })).toHaveCount(0);

    // 새로고침해도 기록이 남는다
    await page.reload();
    await expect(page.getByRole('region', { name: '오늘 경기 체크인' }).getByText('06:12 체크인')).toBeVisible();

    // 명단은 읽기 전용: 본인이 정시로 보이고 확정 버튼이 없다
    await page.goto('/attendance/checkin');
    await expect(page.getByRole('heading', { name: '체크인 명단', level: 1 })).toBeVisible();
    // 데스크톱 사이드바(모바일에서 숨김)에도 내 이름이 있어 페이지 전체로 찾으면 사이드바가 먼저 잡힌다.
    // 2026-11-28: main CI #82·#86 mobile 실패 원인(사이드바 로딩 타이밍에 따라 간헐). 명단 본문(<main>)으로 범위를 좁힌다.
    await expect(page.getByRole('main').getByText('김민준').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /결석 처리/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '정시', exact: true })).toHaveCount(0);
  });
});

test.describe('S1 출석 체크인 v1 — 운영진 확정', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  test('06:40 체크인은 지각, 명단에서 한 명 정시 확정 + 미확인 일괄 결석 → 새로고침·딥링크 복원', async ({ page }, testInfo) => {
    const isDesktop = testInfo.project.name === 'desktop';
    const day = await goToMatchDay(page, '06:40');

    const card = page.getByRole('region', { name: '오늘 경기 체크인' });
    await card.getByRole('button', { name: '도착했어요' }).click();
    await expect(card.getByText('지각')).toBeVisible();
    await card.getByRole('link', { name: '체크인 명단' }).click();
    await expect(page).toHaveURL(new RegExp(`/attendance/checkin\\?date=${day}`));
    await expect(page.getByRole('heading', { name: '체크인 명단', level: 1 })).toBeVisible();

    const tally = page.locator('dl[aria-label="체크인 집계"]');
    // 참석 투표 10명(이서준~임준서) 중 이서준만 체크인(지각) → 미확인 9
    await expect(tally.getByText('지각').locator('..')).toContainText('1');
    await expect(tally.getByText('미확인').locator('..')).toContainText('9');

    if (isDesktop) {
      const row = page.getByRole('row', { name: '박도윤' });
      await row.getByRole('button', { name: '정시' }).click();
      await expect(row.getByRole('button', { name: '정시' })).toHaveAttribute('aria-pressed', 'true');
      await expect(row.getByText('운영진')).toBeVisible();
    } else {
      await page.getByRole('button', { name: '박도윤 미확인' }).click();
      await expect(page).toHaveURL(/member=m-03/);
      const sheet = page.getByRole('dialog');
      await expect(sheet.getByRole('heading', { name: '박도윤 확정' })).toBeVisible();
      // 뒤로가기는 시트를 닫는다
      await page.goBack();
      await expect(sheet).toBeHidden();
      await page.getByRole('button', { name: '박도윤 미확인' }).click();
      await page.getByRole('dialog').getByRole('button', { name: '정시' }).click();
      await expect(page.getByRole('dialog')).toBeHidden();
      await expect(page.getByRole('button', { name: '박도윤 정시' })).toBeVisible();
      await expect(page).not.toHaveURL(/member=/);
    }
    await expect(tally.getByText('미확인').locator('..')).toContainText('8');

    await page.getByRole('button', { name: '미확인 8명 결석 처리' }).click();
    await page.getByRole('button', { name: '미확인 8명 결석 확정' }).click();
    await expect(tally.getByText('결석').locator('..')).toContainText('8');
    await expect(tally.getByText('미확인').locator('..')).toContainText('0');
    await expect(page.getByRole('button', { name: /결석 처리/ })).toHaveCount(0);

    // 새로고침·딥링크: 같은 날짜, 같은 결과
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`date=${day}`));
    await expect(tally.getByText('정시').locator('..')).toContainText('1');
    await expect(tally.getByText('결석').locator('..')).toContainText('8');
    await page.screenshot({ path: testInfo.outputPath(`checkin-roster-${testInfo.project.name}.png`) });
  });
});
