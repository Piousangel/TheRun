import { test, expect } from '@playwright/test';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

// 모바일·데스크톱 두 프로젝트에서 모두 돈다(D-18). 한쪽 skip 금지.
// 모바일은 하단 시트, 데스크톱은 오른쪽 패널로 같은 폼이 열린다.
test.describe('리그 시즌 — 운영진 시즌 만들기', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  test('시즌을 만들면 상세로 가고, 새로고침·뒤로가기·딥링크가 같은 화면을 복원한다', async ({ page }, testInfo) => {
    const isDesktop = testInfo.project.name === 'desktop';
    const name = `e2e 시즌 ${testInfo.project.name}`;

    await page.goto('/seasons');
    await expect(page.getByRole('heading', { name: '리그 시즌', level: 1 })).toBeVisible();

    await page.getByRole('button', { name: /시즌 만들기/ }).first().click();
    await expect(page).toHaveURL(/\/seasons\?sheet=new/);

    // 시트 상태는 URL에 있으므로 새로고침해도 폼이 다시 열린다.
    await page.reload();
    const form = page.getByRole('form', { name: '시즌 만들기' });
    await expect(form).toBeVisible();

    await form.getByLabel('시즌 이름').fill(name);
    await form.getByLabel('쿼터 시간(분)').fill('12');
    await form.getByRole('button', { name: '시즌 만들기' }).click();

    await expect(page).toHaveURL(/\/seasons\/[^/?]+$/);
    const title = page.getByRole('heading', { name, level: 2 });
    await expect(title).toBeVisible();
    // 상세(article) 안에서만 찾는다. 모바일에서는 숨은 목록에도 같은 문구가 있다.
    const detail = page.getByRole('article');
    await expect(detail.getByText('3쿼터 × 12분 · 6:6')).toBeVisible();
    await expect(detail.getByText('준비 중')).toBeVisible();

    // 데스크톱은 목록과 상세가 함께 보인다(2단). 모바일은 상세만.
    const listItem = page.getByRole('link', { name: new RegExp(name) });
    if (isDesktop) await expect(listItem).toBeVisible();
    else await expect(listItem).toBeHidden();

    // 딥링크·새로고침
    const detailUrl = page.url();
    await page.reload();
    await expect(title).toBeVisible();

    // 상태 바꾸기
    await page.getByRole('button', { name: '시즌 시작' }).click();
    await expect(detail.getByText('진행 중')).toBeVisible();

    // 뒤로가기는 만들기 폼이 아니라 목록으로 간다(생성 뒤 replace).
    await page.goBack();
    await expect(page).toHaveURL(/\/seasons$/);
    await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible();

    await page.goto(detailUrl);
    await expect(title).toBeVisible();
  });

  test('데스크톱은 N 키로 만들기 패널을 연다', async ({ page }, testInfo) => {
    await page.goto('/seasons');
    await expect(page.getByRole('heading', { name: '리그 시즌', level: 1 })).toBeVisible();
    // 관리자 권한이 확인돼 버튼이 보인 뒤에 단축키가 등록된다.
    await expect(page.getByRole('button', { name: /시즌 만들기/ }).first()).toBeVisible();
    if (testInfo.project.name === 'desktop') {
      await page.keyboard.press('n');
      await expect(page).toHaveURL(/sheet=new/);
      await expect(page.getByRole('heading', { name: '새 시즌' })).toBeVisible();
    } else {
      // 모바일에는 키보드 단축키가 없고 버튼으로만 연다.
      await page.getByRole('button', { name: /시즌 만들기/ }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
    }
  });
});

test.describe('리그 시즌 — 팀·팀장·일정', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  test('3팀과 팀장을 정하고 4주 × 3경기 일정을 만든다. 팀 편집은 URL로 복원된다', async ({ page }, testInfo) => {
    const isDesktop = testInfo.project.name === 'desktop';
    const name = `e2e 리그 ${testInfo.project.name}`;

    await page.goto('/seasons?sheet=new');
    const createForm = page.getByRole('form', { name: '시즌 만들기' });
    await createForm.getByLabel('시즌 이름').fill(name);
    await createForm.getByRole('button', { name: '시즌 만들기' }).click();
    await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
    const detail = page.getByRole('article');
    const seasonUrl = page.url();

    // 팀이 없으면 일정 버튼은 잠겨 있다.
    await expect(detail.getByRole('button', { name: '일정 자동 생성' })).toBeDisabled();

    const captains = ['김민준', '이서준', '박도윤'];
    for (const [i, captain] of captains.entries()) {
      await detail.getByRole('button', { name: '팀 추가' }).click();
      await expect(page).toHaveURL(/[?&]team=new/);
      if (i === 0) {
        // 시트·패널 상태는 URL에 있으므로 새로고침해도 다시 열린다.
        await page.reload();
      }
      const form = page.getByRole('form', { name: '팀 만들기' });
      await expect(form).toBeVisible();
      // 모바일은 하단 시트(dialog), 데스크톱은 상세 안의 인라인 패널.
      if (isDesktop) await expect(page.getByRole('dialog')).toHaveCount(0);
      else await expect(page.getByRole('dialog')).toBeVisible();
      await expect(form.getByLabel('팀 이름')).toHaveValue(`${String.fromCharCode(65 + i)}팀`);
      await form.getByLabel('팀장').selectOption({ label: captain });
      await form.getByRole('button', { name: '팀 만들기' }).click();
      await expect(form).toBeHidden();
      await expect(page).not.toHaveURL(/team=/);
      await expect(detail.getByText(`팀장 ${captain}`)).toBeVisible();
    }
    await expect(detail.getByRole('heading', { name: '팀 (3)' })).toBeVisible();

    // 이미 팀장인 사람은 다른 팀 팀장으로 고를 수 없다.
    await detail.getByRole('button', { name: /^C팀/ }).click();
    await expect(page).toHaveURL(/[?&]team=[^&]+/);
    const editForm = page.getByRole('form', { name: '팀 수정' });
    await expect(editForm.getByRole('option', { name: '김민준 (다른 팀 팀장)' })).toBeDisabled();
    await editForm.getByLabel('팀 이름').fill('C팀 블루');
    await editForm.getByRole('button', { name: '저장' }).click();
    await expect(editForm).toBeHidden();
    await expect(detail.getByRole('list', { name: '팀 목록' }).getByText('C팀 블루')).toBeVisible();

    // 일정 자동 생성: 3팀 × 4주 = 매주 3경기.
    await detail.getByRole('button', { name: '일정 자동 생성' }).click();
    const schedule = detail.getByRole(isDesktop ? 'table' : 'list', { name: '시즌 일정' });
    await expect(schedule).toBeVisible();
    await expect(schedule.getByText(/^\d주차$/)).toHaveCount(4);
    await expect(schedule.getByText('3경기', { exact: true })).toHaveCount(4);
    await expect(schedule.getByText('A팀').first()).toBeVisible();
    await expect(detail.getByRole('button', { name: '일정 다시 만들기' })).toBeVisible();

    // 일정이 생기면 팀은 지울 수 없다.
    await detail.getByRole('button', { name: /^A팀/ }).click();
    await expect(page.getByRole('form', { name: '팀 수정' }).getByRole('button', { name: '팀 지우기' })).toBeDisabled();
    await page.goBack();
    await expect(page.getByRole('form', { name: '팀 수정' })).toHaveCount(0);

    // 딥링크·새로고침으로 같은 시즌 화면이 복원된다.
    await page.goto(seasonUrl);
    await expect(detail.getByRole('heading', { name: '팀 (3)' })).toBeVisible();
    await expect(detail.getByRole(isDesktop ? 'table' : 'list', { name: '시즌 일정' }).getByText(/^\d주차$/)).toHaveCount(4);
  });
});

test.describe('리그 시즌 — 멤버', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'member.json') });

  test('멤버에게는 만들기 버튼이 없고 ?sheet=new 딥링크도 폼을 열지 않는다', async ({ page }) => {
    await page.goto('/seasons?sheet=new');
    await expect(page.getByRole('heading', { name: '리그 시즌', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /시즌 만들기/ })).toHaveCount(0);
    await expect(page.getByRole('form', { name: '시즌 만들기' })).toHaveCount(0);
  });
});
