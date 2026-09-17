import { expect, type Page } from '@playwright/test';

/**
 * 화면이 "다 그려졌다"고 볼 수 있을 때까지 기다린다. networkidle은 IndexedDB 기반 로컬 어댑터의
 * 데이터 로딩을 기다리지 않아 로딩 화면을 측정하는 일이 있었다.
 * - 첫 h1이 붙어 있고(보이는 뷰포트면 보이고)
 * - 스켈레톤(.animate-pulse)이 하나도 없고
 * - documentElement.scrollHeight가 300ms 간격 두 번 읽기에서 같을 때까지 폴링한다.
 *
 * /more의 h1은 데스크톱에서 `md:hidden`(상단바가 제목을 보여줌)이라 display:none이면 visible은 요구하지 않는다.
 */
export async function waitForPageReady(page: Page, timeout = 20_000) {
  const h1 = page.locator('main h1').first();
  await expect(h1).toBeAttached({ timeout });
  if (await h1.evaluate((el) => getComputedStyle(el).display !== 'none')) {
    await expect(h1).toBeVisible({ timeout });
  }
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout });
  await expect
    .poll(
      async () =>
        page.evaluate(async () => {
          const first = document.documentElement.scrollHeight;
          await new Promise((resolve) => setTimeout(resolve, 300));
          return first === document.documentElement.scrollHeight;
        }),
      { timeout, message: '문서 높이가 안정되지 않는다' },
    )
    .toBe(true);
}

export interface FixedOverlap {
  fixed: string;
  target: string;
}

/**
 * 화면에 보이는 position:fixed 요소가 그 요소 밖의 보이는 상호작용 요소(a, button, input, [role=button])를
 * 덮는지 찾는다. 모바일 탭바(nav[aria-label="주요 메뉴"])와 sonner 토스트 영역은 제외한다
 * (탭바 아래 콘텐츠 가림은 main 하단 패딩 검사가 따로 본다).
 * 반환값이 비어 있어야 한다.
 */
export async function findFixedOverlaps(page: Page): Promise<FixedOverlap[]> {
  return page.evaluate(() => {
    const describe = (el: Element) => {
      const label = el.getAttribute('aria-label') ?? (el.textContent ?? '').trim().slice(0, 30);
      const cls = typeof (el as HTMLElement).className === 'string' ? (el as HTMLElement).className.slice(0, 60) : '';
      return `<${el.tagName.toLowerCase()}${label ? ` "${label}"` : ''}${cls ? ` .${cls}` : ''}>`;
    };
    const isShown = (el: Element) => {
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const isExcluded = (el: Element) =>
      !!el.closest('nav[aria-label="주요 메뉴"], [data-sonner-toaster], section[aria-label^="Notifications"]');

    const fixedEls = [...document.body.querySelectorAll('*')].filter(
      (el) => getComputedStyle(el).position === 'fixed' && isShown(el) && !isExcluded(el),
    );
    // 다른 fixed 요소 안에 든 fixed 요소는 바깥 요소가 대표한다.
    const roots = fixedEls.filter((el) => !fixedEls.some((other) => other !== el && other.contains(el)));

    const targets = [...document.querySelectorAll('a, button, input, [role=button]')].filter(isShown);
    const overlaps: { fixed: string; target: string }[] = [];
    for (const fixed of roots) {
      const f = fixed.getBoundingClientRect();
      for (const target of targets) {
        if (fixed.contains(target) || target.contains(fixed)) continue;
        const t = target.getBoundingClientRect();
        const intersects = f.left < t.right && t.left < f.right && f.top < t.bottom && t.top < f.bottom;
        if (intersects) overlaps.push({ fixed: describe(fixed), target: describe(target) });
      }
    }
    return overlaps;
  });
}
