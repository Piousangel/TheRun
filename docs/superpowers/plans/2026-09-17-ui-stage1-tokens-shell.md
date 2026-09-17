# UI 개편 단계 1 — 토큰 + 앱 셸 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 새 디자인 토큰과 앱 셸(모바일 탭바·헤더, 데스크톱 사이드바·상단바, DEMO 칩, 더보기 페이지)을 도입해, 옛 화면 본문을 그대로 둔 채 **모든 화면에서 셸이 콘텐츠를 가리는 결함을 없앤다.**

**Architecture:** 내비게이션 정의와 라우트 메타는 순수 함수(`src/shared/config/navigation.ts`)로 두고, 셸 UI는 `src/widgets/app-shell/`에 모은다. 루트 레이아웃은 `AppShell` 하나만 렌더한다. 스크롤은 문서(window) 스크롤을 유지하고 `<main>`의 하단 패딩으로 탭바 높이를 비운다. 옛 `AppChrome`·`MobileNav`·랜딩은 삭제한다.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind 3, lucide-react, vaul(Drawer), Zustand 5, Vitest + Testing Library(jsdom), Playwright.

**Spec:** `docs/superpowers/specs/2026-09-17-ui-overhaul-design.md` (A-1, A-2, A-5 중 셸 관련 부분, A-6 단계 1). 결정 배경: `docs/product-decisions.md` D-07.

## Global Constraints

- import는 항상 `@/` 별칭. 상대 경로 import 금지(ESLint error). FSD 방향 shared → entities → features → widgets → app. **같은 레이어 간 import도 하지 않는다**(위젯이 다른 위젯을 import 금지).
- 데이터 접근은 `getApi()`를 통해서만, 컴포넌트는 `entities/*/model/queries.ts`의 훅을 쓴다.
- 핸들러 함수는 컴포넌트 안에 선언한다. 커스텀 컴포넌트에 핸들러를 prop으로 내려보내지 않는다(버튼류 프리미티브의 `onClick`은 예외).
- 색상 토큰 값(정확히 이 값):
  - `--bg #FFFFFF`, `--bg-sunken #F8F9FA`, `--bg-sunken-strong #F1F3F5`
  - `--border #E9ECEF`, `--border-strong #DEE2E6`
  - `--fg #212529`, `--fg-muted #495057`, `--fg-dim #687078`, `--fg-faint #ADB5BD`(**텍스트 사용 금지**)
  - `--brand #C8A858`(버튼 면, 위 글자는 `--fg`), `--brand-dark #8A6D1F`, `--brand-soft #FBF6E9`
  - 신호 fg/bg: red `#B91C1C/#FFF5F5`, amber `#B45309/#FEF3C7`, blue `#1F6FB8/#E8F1FA`, green `#00755B/#E6F5F2`, gray `#475569/#F1F5F9`
- 새로 작성하는 셸 코드에서 금지: `shadow-[...]`, `bg-[linear-gradient...]`, `backdrop-blur`, `tracking-[0.1x~0.2x em]` 대문자 라벨, 영어 장식 문구.
- 모바일 탭 5개 고정·역할 무관: 홈 `/dashboard` · 투표 `/votes` · 경기 `/matches` · 출석 `/attendance` · 더보기 `/more`.
- 탭바 높이 56px + `env(safe-area-inset-bottom)`. 모바일 헤더 56px + `env(safe-area-inset-top)`. 데스크톱 사이드바 232px, 상단바 52px. 브레이크포인트 `md`(768px).
- 터치 타깃 최소 44×44.
- 모든 사용자 노출 문구는 한국어.
- **포트 3000 주의:** 이 머신에서는 3000번에 다른 프로젝트 dev 서버가 떠 있을 수 있다. e2e/수동 확인 전에 `lsof -i :3000`으로 확인하고, Task 9에서 도입하는 `E2E_PORT`를 쓴다. 남의 프로세스를 죽이지 않는다.
- 품질 게이트: `pnpm lint && pnpm type-check && pnpm test && pnpm build`. lint 경고 기준선은 4건(`player-marker.tsx:156`, `position-slot.tsx:47`, `my-page-content.tsx:138,529`) — 늘리지 않는다(삭제로 줄어드는 것은 괜찮다).

---

## File Structure

| 경로 | 책임 | 작업 |
|---|---|---|
| `src/shared/lib/color/contrast.ts` | WCAG 대비비 계산 | 생성 |
| `src/shared/lib/color/contrast.test.ts` | globals.css 토큰 대비 검증 | 생성 |
| `src/app/fonts.ts` | Pretendard `next/font/local` | 생성 |
| `src/app/globals.css` | 토큰 재정의, `.dark`·랜딩 유틸 제거 | 수정 |
| `tailwind.config.ts` | 새 색상·폰트 연결 | 수정 |
| `src/shared/config/navigation.ts` | 탭·사이드바·더보기 항목, 활성 판정, 라우트 메타 | 생성 |
| `src/shared/config/navigation.test.ts` | 위 순수 함수 테스트 | 생성 |
| `src/shared/lib/page-header/store.ts` | 페이지별 헤더 오버라이드 스토어 + `usePageHeader` | 생성 |
| `src/shared/lib/page-header/store.test.tsx` | | 생성 |
| `src/entities/auth/model/labels.ts` | 역할 라벨 | 생성 |
| `src/entities/auth/model/queries.ts` | `useSignOut` 추가 | 수정 |
| `src/widgets/app-shell/ui/mobile-tab-bar.tsx` | 모바일 하단 탭 | 생성 |
| `src/widgets/app-shell/ui/mobile-top-bar.tsx` | 모바일 헤더 | 생성 |
| `src/widgets/app-shell/ui/desktop-sidebar.tsx` | 데스크톱 사이드바 | 생성 |
| `src/widgets/app-shell/ui/desktop-top-bar.tsx` | 데스크톱 상단바 | 생성 |
| `src/widgets/app-shell/ui/app-shell.tsx` | 셸 조립 | 생성 |
| `src/widgets/app-shell/ui/*.test.tsx` | 컴포넌트 테스트 | 생성 |
| `src/shared/ui/grouped-list.tsx` | 그룹 리스트 프리미티브 | 생성 |
| `src/widgets/more/ui/more-page-content.tsx` + `src/app/more/page.tsx` | 더보기 | 생성 |
| `src/shared/ui/drawer.tsx` | 장식 제거 | 수정 |
| `src/features/dev-session/ui/dev-role-switcher.tsx` (+test) | DEMO 칩 + 시트 | 수정 |
| `src/shared/ui/app-page-layout.tsx` | `<main>` 제거, 새 여백·너비 | 수정 |
| `src/app/layout.tsx` | `AppShell`, viewport, 폰트 | 수정 |
| `src/app/page.tsx` | `/dashboard` 리다이렉트 | 수정 |
| `src/middleware.ts` (+test) | `/more`, `/club-guide` 보호 | 수정 |
| `src/shared/ui/app-chrome.tsx`, `src/shared/components/mobile-nav.tsx`, `src/widgets/home/ui/{home-page-content,mobile-landing-carousel,ai-scene-card,reveal-section}.tsx` | 옛 셸·랜딩 | 삭제 |
| `playwright.config.ts`, `e2e/_setup/auth.setup.ts`, `e2e/smoke/route-sweep.spec.ts`, `e2e/visual/shell.spec.ts` | e2e | 수정/생성 |

---

### Task 1: 디자인 토큰 + Pretendard + 대비 테스트

**Files:**
- Create: `src/shared/lib/color/contrast.ts`, `src/shared/lib/color/contrast.test.ts`, `src/app/fonts.ts`
- Modify: `src/app/globals.css:1-68`, `tailwind.config.ts`, `src/app/layout.tsx`, `package.json`, `src/shared/ui/button.tsx`

**Interfaces:**
- Produces: `contrastRatio(foreground: string, background: string): number` (hex `#RRGGBB`). Tailwind 색상 클래스 `bg-sunken`, `bg-sunken-strong`, `border-line-strong`, `text-ink`, `text-ink-muted`, `text-ink-dim`, `text-ink-faint`, `bg-brand`, `text-brand-dark`, `bg-brand-soft`, `text-signal-{red|amber|blue|green|gray}-fg`, `bg-signal-{...}-bg`. 폰트 CSS 변수 `--font-sans`.

- [ ] **Step 1: 대비 계산 실패 테스트 작성**

`src/shared/lib/color/contrast.test.ts`:
```ts
// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { contrastRatio } from '@/shared/lib/color/contrast';

const css = readFileSync(path.resolve(__dirname, '../../../app/globals.css'), 'utf8');

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!match) throw new Error(`globals.css에 --${name} hex 토큰이 없습니다`);
  return match[1];
}

describe('contrastRatio', () => {
  it('흑/백은 21:1, 같은 색은 1:1', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#C8A858', '#C8A858')).toBeCloseTo(1, 5);
  });
});

describe('globals.css 토큰 대비(WCAG AA 4.5:1)', () => {
  const pairs: Array<[fg: string, bg: string]> = [
    ['fg', 'bg'],
    ['fg-muted', 'bg'],
    ['fg-muted', 'bg-sunken-strong'],
    ['fg-dim', 'bg'],
    ['fg-dim', 'bg-sunken'],
    ['brand-dark', 'bg'],
    ['brand-dark', 'brand-soft'],
    ['fg', 'brand'],
    ['signal-red-fg', 'signal-red-bg'],
    ['signal-amber-fg', 'signal-amber-bg'],
    ['signal-blue-fg', 'signal-blue-bg'],
    ['signal-green-fg', 'signal-green-bg'],
    ['signal-gray-fg', 'signal-gray-bg'],
  ];

  it.each(pairs)('%s on %s ≥ 4.5', (fg, bg) => {
    expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
  });
});
```

Note: `path.resolve(__dirname, ...)` 상대 경로 문자열은 import가 아니므로 ESLint 상대 import 규칙에 걸리지 않는다.

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run src/shared/lib/color/contrast.test.ts`
Expected: FAIL — `Cannot find module '@/shared/lib/color/contrast'`

- [ ] **Step 3: `contrast.ts` 구현**

```ts
/** WCAG 2.x 상대 휘도 기반 대비비. 입력은 `#RRGGBB`. */
function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
```

- [ ] **Step 4: `globals.css` 토큰 교체**

`src/app/globals.css`의 첫 `@layer base { :root {...} .dark {...} }` 블록(1~68행 부근, `@layer base {` 부터 `.dark` 블록 닫는 `}`와 레이어 닫는 `}`까지)을 아래로 교체한다. shadcn 변수는 Tailwind 투명도 수식어(`bg-primary/10`)가 계속 동작하도록 HSL 채널 형식을 유지하고, 새 토큰은 hex로 둔다.

```css
@layer base {
  :root {
    /* 새 토큰 — 값은 docs/superpowers/specs/2026-09-17-ui-overhaul-design.md A-1. contrast.test.ts가 이 hex를 읽어 대비를 검증한다. */
    --bg: #FFFFFF;
    --bg-sunken: #F8F9FA;
    --bg-sunken-strong: #F1F3F5;
    --border-strong: #DEE2E6;
    --fg: #212529;
    --fg-muted: #495057;
    --fg-dim: #687078;
    --fg-faint: #ADB5BD; /* 텍스트 금지: 장식 아이콘·비활성 테두리 전용 */
    --brand: #C8A858;
    --brand-dark: #8A6D1F;
    --brand-soft: #FBF6E9;
    --signal-red-fg: #B91C1C;
    --signal-red-bg: #FFF5F5;
    --signal-amber-fg: #B45309;
    --signal-amber-bg: #FEF3C7;
    --signal-blue-fg: #1F6FB8;
    --signal-blue-bg: #E8F1FA;
    --signal-green-fg: #00755B;
    --signal-green-bg: #E6F5F2;
    --signal-gray-fg: #475569;
    --signal-gray-bg: #F1F5F9;

    /* shadcn 호환 채널 — 위 토큰과 같은 색 */
    --background: 0 0% 100%;           /* --bg */
    --foreground: 210 11% 15%;         /* --fg */
    --card: 0 0% 100%;
    --card-foreground: 210 11% 15%;
    --popover: 0 0% 100%;
    --popover-foreground: 210 11% 15%;
    --primary: 43 50% 56%;             /* --brand */
    --primary-foreground: 210 11% 15%; /* 금색 버튼 위 글자는 검정 */
    --secondary: 210 17% 95%;          /* --bg-sunken-strong */
    --secondary-foreground: 210 11% 15%;
    --muted: 210 17% 98%;              /* --bg-sunken */
    --muted-foreground: 210 9% 31%;    /* --fg-muted */
    --accent: 43 69% 95%;              /* --brand-soft */
    --accent-foreground: 44 63% 33%;   /* --brand-dark */
    --destructive: 0 74% 42%;          /* --signal-red-fg */
    --destructive-foreground: 0 0% 100%;
    --border: 210 16% 93%;             /* #E9ECEF */
    --input: 210 14% 89%;              /* --border-strong */
    --ring: 44 63% 33%;                /* --brand-dark */
    --radius: 0.625rem;                /* 10px: 버튼·입력 */
  }
}
```

같은 파일의 `body` 규칙에 폰트를 연결한다(기존 `@apply bg-background text-foreground;` 블록):
```css
  body {
    @apply bg-background text-foreground antialiased;
    font-family: var(--font-sans), system-ui, -apple-system, 'Apple SD Gothic Neo', sans-serif;
    font-feature-settings: "rlig" 1, "calt" 1, "ss01" 1;
  }
```

`@layer utilities`의 `.landing-noise::before`, `.landing-chip`, `.landing-logo-shell::after` 세 규칙은 삭제한다(랜딩 전용, Task 8에서 랜딩 삭제). `editorial-*`, `glass-panel*`, `metric-chip`, `section-surface`는 옛 화면이 아직 쓰므로 **남기고** 블록 위에 주석 한 줄을 단다:
```css
  /* 단계 2(공용 컴포넌트)에서 화면 재작성과 함께 제거한다 — 새 코드에서 쓰지 말 것 */
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm vitest run src/shared/lib/color/contrast.test.ts`
Expected: PASS (15 tests)

- [ ] **Step 6: Tailwind 연결**

`tailwind.config.ts`:
- `darkMode: ['class'],` 줄 삭제
- `theme.extend.colors`에 기존 항목은 그대로 두고 추가:
```ts
        sunken: { DEFAULT: 'var(--bg-sunken)', strong: 'var(--bg-sunken-strong)' },
        line: { strong: 'var(--border-strong)' },
        ink: { DEFAULT: 'var(--fg)', muted: 'var(--fg-muted)', dim: 'var(--fg-dim)', faint: 'var(--fg-faint)' },
        brand: { DEFAULT: 'var(--brand)', dark: 'var(--brand-dark)', soft: 'var(--brand-soft)' },
        signal: {
          red: { fg: 'var(--signal-red-fg)', bg: 'var(--signal-red-bg)' },
          amber: { fg: 'var(--signal-amber-fg)', bg: 'var(--signal-amber-bg)' },
          blue: { fg: 'var(--signal-blue-fg)', bg: 'var(--signal-blue-bg)' },
          green: { fg: 'var(--signal-green-fg)', bg: 'var(--signal-green-bg)' },
          gray: { fg: 'var(--signal-gray-fg)', bg: 'var(--signal-gray-bg)' },
        },
```
- `theme.extend`에 추가:
```ts
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Apple SD Gothic Neo', 'sans-serif'],
      },
```

- [ ] **Step 7: Pretendard 설치와 폰트 모듈**

Run: `pnpm add pretendard@1.3.9`
Run: `ls node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2`
Expected: 파일 경로가 출력된다(`.npmrc`의 `node-linker=hoisted` 덕분에 루트 `node_modules`에 있다). 없으면 `find node_modules/pretendard -name 'PretendardVariable.woff2'`로 실제 경로를 찾아 아래 `src`에 반영한다.

`src/app/fonts.ts`:
```ts
import localFont from 'next/font/local';

/** 한국어 본문 폰트. 가변 폰트 하나로 45~920 굵기를 모두 낸다. */
export const pretendard = localFont({
  src: '../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
  variable: '--font-sans',
  weight: '45 920',
  display: 'swap',
});
```

`src/app/layout.tsx`: `import { pretendard } from '@/app/fonts';` 추가, `<html lang="ko">` → `<html lang="ko" className={pretendard.variable}>`.

- [ ] **Step 8: Button 장식 제거**

`src/shared/ui/button.tsx`의 `buttonVariants`를 아래로 교체한다(그림자·hover 떠오름·`active:scale` 제거, 반경 10px). variant·size 이름은 유지해 기존 사용처가 깨지지 않게 한다.
```ts
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background text-foreground hover:bg-muted",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "text-foreground hover:bg-muted",
        link: "text-brand-dark underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```
`default` 높이를 40→44px로 올리는 것은 터치 타깃 44px 제약 때문이다.

- [ ] **Step 9: 게이트**

Run: `pnpm lint && pnpm type-check && pnpm test && pnpm build`
Expected: 전부 통과. lint 경고 4건 이하.

- [ ] **Step 10: 커밋**

```bash
git add package.json pnpm-lock.yaml tailwind.config.ts src/app/globals.css src/app/fonts.ts src/app/layout.tsx src/shared/lib/color src/shared/ui/button.tsx
git commit -m "feat(ui): 새 디자인 토큰·Pretendard·대비 검증 테스트, Button 장식 제거"
```

---

### Task 2: 내비게이션 정의와 라우트 메타(순수 함수)

**Files:**
- Create: `src/shared/config/navigation.ts`, `src/shared/config/navigation.test.ts`

**Interfaces:**
- Produces:
```ts
export interface NavItem { href: string; label: string; icon: LucideIcon; adminOnly?: boolean }
export interface NavGroup { label: string | null; items: NavItem[] }
export const TAB_ITEMS: readonly NavItem[];           // 5개, 마지막이 /more
export const NAV_GROUPS: readonly NavGroup[];         // [주요(label null), 클럽, 운영, 계정]
export const MORE_GROUPS: readonly NavGroup[];        // NAV_GROUPS에서 첫 그룹 제외
export function visibleGroups(groups: readonly NavGroup[], isAdmin: boolean): NavGroup[];
export function isNavItemActive(pathname: string, href: string): boolean;
export function activeTabHref(pathname: string): string | null;
export function isShellHidden(pathname: string): boolean;
export type RouteKind = 'home' | 'root' | 'more-child' | 'deep';
export interface RouteMeta { title: string; kind: RouteKind; backHref: string | null }
export function resolveRouteMeta(pathname: string): RouteMeta;
```

- [ ] **Step 1: 실패 테스트 작성**

`src/shared/config/navigation.test.ts`:
```ts
import {
  MORE_GROUPS,
  NAV_GROUPS,
  TAB_ITEMS,
  activeTabHref,
  isNavItemActive,
  isShellHidden,
  resolveRouteMeta,
  visibleGroups,
} from '@/shared/config/navigation';

describe('TAB_ITEMS', () => {
  it('역할 무관 5개: 홈·투표·경기·출석·더보기', () => {
    expect(TAB_ITEMS.map((item) => [item.label, item.href])).toEqual([
      ['홈', '/dashboard'],
      ['투표', '/votes'],
      ['경기', '/matches'],
      ['출석', '/attendance'],
      ['더보기', '/more'],
    ]);
  });
});

describe('visibleGroups', () => {
  it('멤버에게는 운영 그룹이 없다', () => {
    expect(visibleGroups(NAV_GROUPS, false).map((g) => g.label)).toEqual([null, '클럽', '계정']);
  });

  it('관리자에게는 운영 그룹(멤버, 전략·팀 편성)이 보인다', () => {
    const ops = visibleGroups(NAV_GROUPS, true).find((g) => g.label === '운영');
    expect(ops?.items.map((i) => i.href)).toEqual(['/members', '/strategy']);
  });

  it('더보기 그룹은 주요 그룹을 제외한다', () => {
    expect(MORE_GROUPS.map((g) => g.label)).toEqual(['클럽', '운영', '계정']);
  });
});

describe('isNavItemActive', () => {
  it('정확히 같거나 하위 경로면 활성', () => {
    expect(isNavItemActive('/votes', '/votes')).toBe(true);
    expect(isNavItemActive('/votes/abc', '/votes')).toBe(true);
  });

  it('접두어만 같은 다른 경로는 비활성', () => {
    expect(isNavItemActive('/votes-archive', '/votes')).toBe(false);
  });
});

describe('activeTabHref', () => {
  it('탭 경로와 그 하위는 해당 탭', () => {
    expect(activeTabHref('/dashboard')).toBe('/dashboard');
    expect(activeTabHref('/matches/m-1')).toBe('/matches');
  });

  it('더보기 안의 화면은 더보기 탭', () => {
    for (const path of ['/more', '/announcements', '/club-guide', '/members', '/members/m-1', '/strategy', '/me']) {
      expect(activeTabHref(path)).toBe('/more');
    }
  });

  it('모르는 경로는 null', () => {
    expect(activeTabHref('/unknown')).toBeNull();
  });
});

describe('isShellHidden', () => {
  it('인증 화면에서는 셸을 숨긴다', () => {
    for (const path of ['/login', '/signup', '/reset', '/auth/callback']) {
      expect(isShellHidden(path)).toBe(true);
    }
  });

  it('앱 화면에서는 셸을 보인다', () => {
    expect(isShellHidden('/dashboard')).toBe(false);
    expect(isShellHidden('/more')).toBe(false);
  });
});

describe('resolveRouteMeta', () => {
  it('홈', () => {
    expect(resolveRouteMeta('/dashboard')).toEqual({ title: '홈', kind: 'home', backHref: null });
  });

  it('탭 루트는 헤더 없는 root', () => {
    expect(resolveRouteMeta('/votes')).toEqual({ title: '투표', kind: 'root', backHref: null });
    expect(resolveRouteMeta('/more')).toEqual({ title: '더보기', kind: 'root', backHref: null });
  });

  it('더보기 하위 화면은 /more로 돌아간다', () => {
    expect(resolveRouteMeta('/announcements')).toEqual({ title: '공지', kind: 'more-child', backHref: '/more' });
    expect(resolveRouteMeta('/strategy')).toEqual({ title: '전략·팀 편성', kind: 'more-child', backHref: '/more' });
  });

  it('상세 화면은 목록으로 돌아간다', () => {
    expect(resolveRouteMeta('/votes/v-1')).toEqual({ title: '투표', kind: 'deep', backHref: '/votes' });
    expect(resolveRouteMeta('/matches/m-1')).toEqual({ title: '경기', kind: 'deep', backHref: '/matches' });
    expect(resolveRouteMeta('/members/m-1')).toEqual({ title: '멤버', kind: 'deep', backHref: '/members' });
  });

  it('모르는 경로는 제목 없는 root', () => {
    expect(resolveRouteMeta('/unknown')).toEqual({ title: '', kind: 'root', backHref: null });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run src/shared/config/navigation.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/shared/config/navigation.ts`:
```ts
import type { LucideIcon } from 'lucide-react';
import { Bell, BookOpen, CalendarCheck, ClipboardList, Ellipsis, Home, Trophy, UserRound, Users, Vote } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const HOME: NavItem = { href: '/dashboard', label: '홈', icon: Home };
const VOTES: NavItem = { href: '/votes', label: '투표', icon: Vote };
const MATCHES: NavItem = { href: '/matches', label: '경기', icon: Trophy };
const ATTENDANCE: NavItem = { href: '/attendance', label: '출석', icon: CalendarCheck };
const MORE: NavItem = { href: '/more', label: '더보기', icon: Ellipsis };
const ANNOUNCEMENTS: NavItem = { href: '/announcements', label: '공지', icon: Bell };
const CLUB_GUIDE: NavItem = { href: '/club-guide', label: '클럽 안내', icon: BookOpen };
const MEMBERS: NavItem = { href: '/members', label: '멤버', icon: Users, adminOnly: true };
const STRATEGY: NavItem = { href: '/strategy', label: '전략·팀 편성', icon: ClipboardList, adminOnly: true };
const ME: NavItem = { href: '/me', label: '내 정보', icon: UserRound };

export const TAB_ITEMS: readonly NavItem[] = [HOME, VOTES, MATCHES, ATTENDANCE, MORE];

export const NAV_GROUPS: readonly NavGroup[] = [
  { label: null, items: [HOME, VOTES, MATCHES, ATTENDANCE] },
  { label: '클럽', items: [ANNOUNCEMENTS, CLUB_GUIDE] },
  { label: '운영', items: [MEMBERS, STRATEGY] },
  { label: '계정', items: [ME] },
];

export const MORE_GROUPS: readonly NavGroup[] = NAV_GROUPS.slice(1);

const MORE_CHILDREN: readonly NavItem[] = MORE_GROUPS.flatMap((group) => group.items);

/** 목록 → 상세로 들어가는 경로. 상세 헤더는 목록으로 돌아간다. */
const DEEP_PARENTS: readonly NavItem[] = [VOTES, MATCHES, MEMBERS];

const SHELL_HIDDEN_ROUTES = ['/login', '/signup', '/reset', '/auth'];

export function visibleGroups(groups: readonly NavGroup[], isAdmin: boolean): NavGroup[] {
  return groups
    .map((group) => ({ ...group, items: group.items.filter((item) => isAdmin || !item.adminOnly) }))
    .filter((group) => group.items.length > 0);
}

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function activeTabHref(pathname: string): string | null {
  if (isNavItemActive(pathname, MORE.href) || MORE_CHILDREN.some((item) => isNavItemActive(pathname, item.href))) {
    return MORE.href;
  }
  return TAB_ITEMS.find((item) => isNavItemActive(pathname, item.href))?.href ?? null;
}

export function isShellHidden(pathname: string): boolean {
  return SHELL_HIDDEN_ROUTES.some((route) => isNavItemActive(pathname, route));
}

export type RouteKind = 'home' | 'root' | 'more-child' | 'deep';

export interface RouteMeta {
  title: string;
  kind: RouteKind;
  backHref: string | null;
}

export function resolveRouteMeta(pathname: string): RouteMeta {
  if (pathname === HOME.href) return { title: HOME.label, kind: 'home', backHref: null };

  const tabRoot = TAB_ITEMS.find((item) => item.href === pathname);
  if (tabRoot) return { title: tabRoot.label, kind: 'root', backHref: null };

  const deepParent = DEEP_PARENTS.find((item) => pathname.startsWith(`${item.href}/`));
  if (deepParent) return { title: deepParent.label, kind: 'deep', backHref: deepParent.href };

  const moreChild = MORE_CHILDREN.find((item) => item.href === pathname);
  if (moreChild) return { title: moreChild.label, kind: 'more-child', backHref: MORE.href };

  return { title: '', kind: 'root', backHref: null };
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm vitest run src/shared/config/navigation.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/config
git commit -m "feat(ui): 내비게이션 정의와 라우트 메타 순수 함수"
```

---

### Task 3: 페이지 헤더 오버라이드 스토어

상세 화면이 "투표" 대신 실제 투표 제목을 헤더에 띄울 수 있게 하는 계약이다. 단계 1에서는 셸이 읽기만 하고, 페이지 쪽 사용은 단계 4에서 시작한다.

**Files:**
- Create: `src/shared/lib/page-header/store.ts`, `src/shared/lib/page-header/store.test.tsx`

**Interfaces:**
- Produces:
```ts
export interface PageHeaderOverride { title?: string; subtitle?: string; backHref?: string }
export const usePageHeaderStore: UseBoundStore<StoreApi<{ override: PageHeaderOverride | null; setOverride(o: PageHeaderOverride): void; clearOverride(): void }>>;
export function usePageHeader(override: PageHeaderOverride): void;
```

- [ ] **Step 1: 실패 테스트**

`src/shared/lib/page-header/store.test.tsx`:
```tsx
import { renderHook } from '@testing-library/react';
import { usePageHeader, usePageHeaderStore } from '@/shared/lib/page-header/store';

describe('usePageHeader', () => {
  afterEach(() => usePageHeaderStore.getState().clearOverride());

  it('마운트하면 오버라이드를 설정하고 언마운트하면 지운다', () => {
    const { unmount } = renderHook(() => usePageHeader({ title: '9월 19일 정기 경기', backHref: '/votes' }));
    expect(usePageHeaderStore.getState().override).toEqual({ title: '9월 19일 정기 경기', backHref: '/votes' });
    unmount();
    expect(usePageHeaderStore.getState().override).toBeNull();
  });

  it('제목이 바뀌면 오버라이드도 바뀐다', () => {
    const { rerender } = renderHook(({ title }) => usePageHeader({ title }), { initialProps: { title: '불러오는 제목' } });
    rerender({ title: '실제 제목' });
    expect(usePageHeaderStore.getState().override?.title).toBe('실제 제목');
  });
});
```

Note: 테스트 문자열 `'불러오는 제목'`은 JSX 텍스트가 아니므로 기존 "로딩 텍스트 금지" ESLint 규칙(`불러오는 중`)에 걸리지 않는다.

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run src/shared/lib/page-header/store.test.tsx`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/shared/lib/page-header/store.ts`:
```ts
import { useEffect } from 'react';
import { create } from 'zustand';

export interface PageHeaderOverride {
  title?: string;
  subtitle?: string;
  backHref?: string;
}

interface PageHeaderState {
  override: PageHeaderOverride | null;
  setOverride: (override: PageHeaderOverride) => void;
  clearOverride: () => void;
}

/** 셸 헤더(모바일 상단·데스크톱 상단바)의 제목을 페이지가 덮어쓸 때 쓴다. 기본값은 navigation.ts의 라우트 메타. */
export const usePageHeaderStore = create<PageHeaderState>((set) => ({
  override: null,
  setOverride: (override) => set({ override }),
  clearOverride: () => set({ override: null }),
}));

export function usePageHeader({ title, subtitle, backHref }: PageHeaderOverride): void {
  useEffect(() => {
    const override: PageHeaderOverride = {};
    if (title !== undefined) override.title = title;
    if (subtitle !== undefined) override.subtitle = subtitle;
    if (backHref !== undefined) override.backHref = backHref;
    usePageHeaderStore.getState().setOverride(override);
    return () => usePageHeaderStore.getState().clearOverride();
  }, [title, subtitle, backHref]);
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm vitest run src/shared/lib/page-header/store.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/lib/page-header
git commit -m "feat(ui): 페이지 헤더 오버라이드 스토어"
```

---

### Task 4: 모바일 탭바 + 모바일 헤더

**Files:**
- Create: `src/widgets/app-shell/ui/mobile-tab-bar.tsx`, `src/widgets/app-shell/ui/mobile-top-bar.tsx`, `src/widgets/app-shell/ui/mobile-shell.test.tsx`

**Interfaces:**
- Consumes: `TAB_ITEMS`, `activeTabHref`, `resolveRouteMeta` (Task 2), `usePageHeaderStore` (Task 3), `useAuth()` → `{ member: Member | null }` (`@/providers/auth-provider`), `TheRunLogo` (`@/shared/ui/the-run-logo`)
- Produces: `MobileTabBar()` — `<nav aria-label="주요 메뉴">`; `MobileTopBar()` — `kind === 'root'`이면 `null`

- [ ] **Step 1: 실패 테스트**

`src/widgets/app-shell/ui/mobile-shell.test.tsx`:
```tsx
import { render, screen, within } from '@testing-library/react';
import { MobileTabBar } from '@/widgets/app-shell/ui/mobile-tab-bar';
import { MobileTopBar } from '@/widgets/app-shell/ui/mobile-top-bar';
import { usePageHeaderStore } from '@/shared/lib/page-header/store';

const nav = vi.hoisted(() => ({ pathname: '/dashboard' }));
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }));

const auth = vi.hoisted(() => ({ member: { name: '이서준' } as { name: string } | null }));
vi.mock('@/providers/auth-provider', () => ({ useAuth: () => ({ member: auth.member }) }));

afterEach(() => {
  nav.pathname = '/dashboard';
  usePageHeaderStore.getState().clearOverride();
});

describe('MobileTabBar', () => {
  it('탭 5개를 순서대로 렌더한다', () => {
    render(<MobileTabBar />);
    const links = within(screen.getByRole('navigation', { name: '주요 메뉴' })).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['홈', '투표', '경기', '출석', '더보기']);
  });

  it('현재 탭에 aria-current="page"를 단다', () => {
    nav.pathname = '/matches/m-1';
    render(<MobileTabBar />);
    expect(screen.getByRole('link', { name: '경기' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '홈' })).not.toHaveAttribute('aria-current');
  });

  it('더보기 하위 화면에서는 더보기 탭이 활성', () => {
    nav.pathname = '/announcements';
    render(<MobileTabBar />);
    expect(screen.getByRole('link', { name: '더보기' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('MobileTopBar', () => {
  it('홈에서는 멤버 이름을 보여준다', () => {
    render(<MobileTopBar />);
    expect(screen.getByText('이서준님')).toBeInTheDocument();
  });

  it('탭 루트에서는 렌더하지 않는다', () => {
    nav.pathname = '/votes';
    const { container } = render(<MobileTopBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('상세 화면에서는 뒤로가기와 라우트 제목', () => {
    nav.pathname = '/votes/v-1';
    render(<MobileTopBar />);
    expect(screen.getByRole('link', { name: '뒤로' })).toHaveAttribute('href', '/votes');
    expect(screen.getByText('투표')).toBeInTheDocument();
  });

  it('페이지 오버라이드가 제목과 뒤로가기 대상을 덮는다', () => {
    nav.pathname = '/votes/v-1';
    usePageHeaderStore.getState().setOverride({ title: '9월 19일 정기 경기', subtitle: '마감 D-2' });
    render(<MobileTopBar />);
    expect(screen.getByText('9월 19일 정기 경기')).toBeInTheDocument();
    expect(screen.getByText('마감 D-2')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run src/widgets/app-shell/ui/mobile-shell.test.tsx`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: `mobile-tab-bar.tsx` 구현**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TAB_ITEMS, activeTabHref } from '@/shared/config/navigation';
import { cn } from '@/shared/lib/utils';

export function MobileTabBar() {
  const pathname = usePathname();
  const activeHref = activeTabHref(pathname);

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TAB_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px]',
              isActive ? 'font-bold text-brand-dark' : 'font-medium text-ink-muted',
            )}
          >
            <Icon size={22} aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: `mobile-top-bar.tsx` 구현**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { resolveRouteMeta } from '@/shared/config/navigation';
import { usePageHeaderStore } from '@/shared/lib/page-header/store';
import { TheRunLogo } from '@/shared/ui/the-run-logo';

export function MobileTopBar() {
  const pathname = usePathname();
  const { member } = useAuth();
  const override = usePageHeaderStore((state) => state.override);
  const meta = resolveRouteMeta(pathname);

  if (meta.kind === 'root') return null;

  const title = override?.title ?? meta.title;
  const subtitle = override?.subtitle;
  const backHref = override?.backHref ?? meta.backHref;

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background px-3 md:hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(3.5rem + env(safe-area-inset-top))' }}
    >
      {meta.kind === 'home' ? (
        <>
          <TheRunLogo className="ml-1 h-7 w-7" />
          <span className="text-[17px] font-bold text-ink">The Run</span>
          {member && (
            <span className="ml-auto rounded-full bg-brand-soft px-3 py-1 text-sm font-bold text-brand-dark">
              {member.name}님
            </span>
          )}
        </>
      ) : (
        <>
          {backHref && (
            <Link href={backHref} aria-label="뒤로" className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center text-ink">
              <ChevronLeft size={22} aria-hidden />
            </Link>
          )}
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold leading-tight text-ink">{title}</p>
            {subtitle && <p className="truncate text-xs text-ink-dim">{subtitle}</p>}
          </div>
        </>
      )}
    </header>
  );
}
```

- [ ] **Step 5: 통과 확인**

Run: `pnpm vitest run src/widgets/app-shell/ui/mobile-shell.test.tsx`
Expected: PASS (7 tests)

- [ ] **Step 6: 커밋**

```bash
git add src/widgets/app-shell
git commit -m "feat(ui): 모바일 탭바와 헤더"
```

---

### Task 5: 데스크톱 사이드바 + 상단바 + 로그아웃 훅

**Files:**
- Create: `src/entities/auth/model/labels.ts`, `src/widgets/app-shell/ui/desktop-sidebar.tsx`, `src/widgets/app-shell/ui/desktop-top-bar.tsx`, `src/widgets/app-shell/ui/desktop-shell.test.tsx`
- Modify: `src/entities/auth/model/queries.ts` (파일 끝에 훅 추가), `src/entities/auth/model/queries.test.tsx` (테스트 추가)

**Interfaces:**
- Consumes: Task 2의 `NAV_GROUPS`, `visibleGroups`, `isNavItemActive`, `resolveRouteMeta`; Task 3의 `usePageHeaderStore`; `useAuth()` → `{ member, profile, isAdmin }`; `AppRole = 'superadmin' | 'admin' | 'member'` (`@/shared/types/auth`)
- Produces: `ROLE_LABELS: Record<AppRole, string>`; `useSignOut(): UseMutationResult<void, Error, void>` (성공 시 쿼리 캐시 전체 clear); `DesktopSidebar()` — `<nav aria-label="사이드 메뉴">`; `DesktopTopBar()`

- [ ] **Step 1: `useSignOut` 실패 테스트**

`src/entities/auth/model/queries.test.tsx` 2행의 import에 `useSignOut`를 추가하고(`act`, `renderHook`, `setupTestApi`, `__setApiForTests`는 이미 import돼 있다), 파일 끝에 다음 `describe`를 추가한다:
```tsx
describe('useSignOut', () => {
  afterEach(() => __setApiForTests(null));

  it('세션을 지운다', async () => {
    const { api, wrapper } = setupTestApi();
    await api.auth.signInAsDemo('member');
    const { result } = renderHook(() => useSignOut(), { wrapper });
    await act(() => result.current.mutateAsync());
    expect(await api.auth.getUser()).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run src/entities/auth/model/queries.test.tsx`
Expected: FAIL — `useSignOut` is not exported

- [ ] **Step 3: 훅과 라벨 구현**

`src/entities/auth/model/queries.ts` 끝에 추가(파일 상단 import에 `useMutation`, `useQueryClient`, `getApi`가 이미 있다. 없으면 추가):
```ts
export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => getApi().auth.signOut(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
```

`src/entities/auth/model/labels.ts`:
```ts
import type { AppRole } from '@/shared/types/auth';

export const ROLE_LABELS: Record<AppRole, string> = {
  member: '멤버',
  admin: '운영진',
  superadmin: '슈퍼관리자',
};
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm vitest run src/entities/auth/model/queries.test.tsx`
Expected: PASS

- [ ] **Step 5: 셸 컴포넌트 실패 테스트**

`src/widgets/app-shell/ui/desktop-shell.test.tsx`:
```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DesktopSidebar } from '@/widgets/app-shell/ui/desktop-sidebar';
import { DesktopTopBar } from '@/widgets/app-shell/ui/desktop-top-bar';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

const nav = vi.hoisted(() => ({ pathname: '/dashboard', push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: nav.push, refresh: nav.refresh }),
}));

const auth = vi.hoisted(() => ({
  isAdmin: false,
  member: { name: '이서준' } as { name: string } | null,
  profile: { role: 'member' } as { role: 'member' | 'admin' | 'superadmin' } | null,
}));
vi.mock('@/providers/auth-provider', () => ({ useAuth: () => auth }));

afterEach(() => {
  __setApiForTests(null);
  nav.pathname = '/dashboard';
  nav.push.mockClear();
  auth.isAdmin = false;
  auth.profile = { role: 'member' };
});

describe('DesktopSidebar', () => {
  it('멤버에게는 운영 메뉴가 없다', () => {
    const { wrapper } = setupTestApi();
    render(<DesktopSidebar />, { wrapper });
    const sidebar = screen.getByRole('navigation', { name: '사이드 메뉴' });
    expect(within(sidebar).queryByRole('link', { name: '멤버' })).toBeNull();
    expect(within(sidebar).getByRole('link', { name: '출석' })).toBeInTheDocument();
  });

  it('관리자에게는 운영 메뉴가 보이고 현재 화면이 활성', () => {
    auth.isAdmin = true;
    auth.profile = { role: 'admin' };
    nav.pathname = '/members/m-1';
    const { wrapper } = setupTestApi();
    render(<DesktopSidebar />, { wrapper });
    expect(screen.getByRole('link', { name: '멤버' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('운영진')).toBeInTheDocument();
  });

  it('로그아웃하면 세션을 지우고 /login으로 보낸다', async () => {
    const { api, wrapper } = setupTestApi();
    await api.auth.signInAsDemo('member');
    render(<DesktopSidebar />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(await api.auth.getUser()).toBeNull();
    expect(nav.push).toHaveBeenCalledWith('/login');
  });
});

describe('DesktopTopBar', () => {
  it('루트 화면은 제목만', () => {
    nav.pathname = '/votes';
    render(<DesktopTopBar />);
    expect(screen.getByText('투표')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '뒤로' })).toBeNull();
  });

  it('상세 화면은 뒤로가기 포함', () => {
    nav.pathname = '/matches/m-1';
    render(<DesktopTopBar />);
    expect(screen.getByRole('link', { name: '뒤로' })).toHaveAttribute('href', '/matches');
  });
});
```

- [ ] **Step 6: 실패 확인**

Run: `pnpm vitest run src/widgets/app-shell/ui/desktop-shell.test.tsx`
Expected: FAIL — 모듈 없음

- [ ] **Step 7: `desktop-sidebar.tsx` 구현**

```tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { ROLE_LABELS } from '@/entities/auth/model/labels';
import { useSignOut } from '@/entities/auth/model/queries';
import { useAuth } from '@/providers/auth-provider';
import { NAV_GROUPS, isNavItemActive, visibleGroups } from '@/shared/config/navigation';
import { cn } from '@/shared/lib/utils';
import { TheRunLogo } from '@/shared/ui/the-run-logo';

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { member, profile, isAdmin } = useAuth();
  const signOut = useSignOut();

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-border bg-background md:flex">
      <Link href="/dashboard" className="flex h-[52px] shrink-0 items-center gap-2 px-[18px]">
        <TheRunLogo className="h-7 w-7" />
        <span className="text-[15px] font-bold text-ink">The Run</span>
      </Link>

      <nav aria-label="사이드 메뉴" className="flex-1 overflow-y-auto px-3 pb-4">
        {visibleGroups(NAV_GROUPS, isAdmin).map((group) => (
          <div key={group.label ?? 'main'} className="mt-4 first:mt-1">
            {group.label && <p className="px-3 pb-1 text-xs font-bold text-ink-dim">{group.label}</p>}
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive = isNavItemActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex h-9 items-center gap-2.5 rounded-lg px-3 text-[14px]',
                        isActive ? 'bg-brand-soft font-semibold text-brand-dark' : 'text-ink-muted hover:bg-sunken',
                      )}
                    >
                      <Icon size={18} aria-hidden />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{member?.name ?? '이름 없음'}</p>
          {profile && <p className="text-xs text-ink-dim">{ROLE_LABELS[profile.role]}</p>}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signOut.isPending}
          aria-label="로그아웃"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-sunken disabled:opacity-50"
        >
          <LogOut size={18} aria-hidden />
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 8: `desktop-top-bar.tsx` 구현**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { resolveRouteMeta } from '@/shared/config/navigation';
import { usePageHeaderStore } from '@/shared/lib/page-header/store';

export function DesktopTopBar() {
  const pathname = usePathname();
  const override = usePageHeaderStore((state) => state.override);
  const meta = resolveRouteMeta(pathname);
  const title = override?.title ?? meta.title;
  const backHref = meta.kind === 'deep' ? (override?.backHref ?? meta.backHref) : null;

  return (
    <header className="sticky top-0 z-20 hidden h-[52px] items-center gap-2 border-b border-border bg-background px-6 md:flex">
      {backHref && (
        <Link href={backHref} aria-label="뒤로" className="-ml-2 flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-sunken">
          <ChevronLeft size={20} aria-hidden />
        </Link>
      )}
      <p className="truncate text-[15px] font-bold text-ink">{title}</p>
    </header>
  );
}
```

- [ ] **Step 9: 통과 확인**

Run: `pnpm vitest run src/widgets/app-shell src/entities/auth`
Expected: PASS

- [ ] **Step 10: 커밋**

```bash
git add src/entities/auth src/widgets/app-shell
git commit -m "feat(ui): 데스크톱 사이드바·상단바와 로그아웃 훅"
```

---

### Task 6: 셸 조립 + 루트 레이아웃 교체 + 옛 셸 삭제

**Files:**
- Create: `src/widgets/app-shell/ui/app-shell.tsx`, `src/widgets/app-shell/ui/app-shell.test.tsx`
- Modify: `src/app/layout.tsx`, `src/shared/ui/app-page-layout.tsx`, `src/app/{attendance,matches,votes,announcements,me,members,strategy}/page.tsx`, `src/app/{matches,votes,members}/[id]/page.tsx`
- Delete: `src/shared/ui/app-chrome.tsx`, `src/shared/components/mobile-nav.tsx`

**Interfaces:**
- Consumes: Task 4·5의 네 컴포넌트, Task 2의 `isShellHidden`, `resolveRouteMeta`
- Produces: `AppShell({ children }: { children: ReactNode })`; `AppPageLayout({ children, width?: 'content' | 'narrow', className? })` — `content`=`max-w-[1120px]`(기본), `narrow`=`max-w-3xl`

- [ ] **Step 1: 실패 테스트**

`src/widgets/app-shell/ui/app-shell.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { AppShell } from '@/widgets/app-shell/ui/app-shell';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

const nav = vi.hoisted(() => ({ pathname: '/dashboard' }));
vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({ member: null, profile: null, isAdmin: false }),
}));

afterEach(() => {
  nav.pathname = '/dashboard';
});

describe('AppShell', () => {
  it('앱 화면에서는 탭바·사이드바와 main을 렌더한다', () => {
    const { wrapper } = setupTestApi();
    render(<AppShell><p>본문</p></AppShell>, { wrapper });
    expect(screen.getByRole('navigation', { name: '주요 메뉴' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '사이드 메뉴' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('본문');
  });

  it('로그인 화면에서는 셸 없이 children만', () => {
    nav.pathname = '/login';
    const { wrapper } = setupTestApi();
    render(<AppShell><p>로그인 폼</p></AppShell>, { wrapper });
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.getByText('로그인 폼')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run src/widgets/app-shell/ui/app-shell.test.tsx`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: `app-shell.tsx` 구현**

```tsx
'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isShellHidden, resolveRouteMeta } from '@/shared/config/navigation';
import { DesktopSidebar } from '@/widgets/app-shell/ui/desktop-sidebar';
import { DesktopTopBar } from '@/widgets/app-shell/ui/desktop-top-bar';
import { MobileTabBar } from '@/widgets/app-shell/ui/mobile-tab-bar';
import { MobileTopBar } from '@/widgets/app-shell/ui/mobile-top-bar';

/**
 * 스크롤은 문서(window) 스크롤이다. 탭바는 fixed라서 <main> 하단 패딩으로 그 높이를 비운다.
 * 스펙 A-2 "스크롤 모델" 참고 — 옛 화면의 sticky/fixed·전술보드 좌표가 window 기준이다.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isShellHidden(pathname)) return <>{children}</>;

  const { kind } = resolveRouteMeta(pathname);

  return (
    <div className="min-h-dvh bg-background">
      <DesktopSidebar />
      <div className="md:pl-[232px]">
        <MobileTopBar />
        <DesktopTopBar />
        {kind === 'root' && <div aria-hidden className="md:hidden" style={{ height: 'env(safe-area-inset-top)' }} />}
        <main className="pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
      </div>
      <MobileTabBar />
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm vitest run src/widgets/app-shell/ui/app-shell.test.tsx`
Expected: PASS

- [ ] **Step 5: `AppPageLayout` 교체**

`src/shared/ui/app-page-layout.tsx` 전체:
```tsx
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface AppPageLayoutProps {
  children: ReactNode;
  /** content: 목록·대시보드(1120px) / narrow: 폼·문서(768px) */
  width?: 'content' | 'narrow';
  className?: string;
}

/** 셸 <main> 안에서 페이지 여백과 최대 너비만 잡는다. <main>은 AppShell이 가진다. */
export function AppPageLayout({ children, width = 'content', className }: AppPageLayoutProps) {
  return (
    <div className={cn('px-4 py-4 md:px-6 md:py-6', className)}>
      <div className={cn('mx-auto', width === 'content' ? 'max-w-[1120px]' : 'max-w-3xl')}>{children}</div>
    </div>
  );
}
```

페이지 수정:
- `maxWidth="7xl"` / `maxWidth="5xl"` → 속성 삭제(기본 `content`): `matches`, `votes`, `members`, `strategy`, `announcements`
- `maxWidth="4xl"` → `width="narrow"`: `attendance`, `me`
- `src/app/{matches,votes,members}/[id]/page.tsx`의 `<main className="min-h-screen p-4 sm:p-8"><div className="max-w-4xl mx-auto">…</div></main>`(형태가 조금 다르면 그 래퍼 전체)를 `<AppPageLayout width="narrow">…</AppPageLayout>`로 바꾸고 `import { AppPageLayout } from '@/shared/ui/app-page-layout';` 추가. 각 파일을 열어 래퍼 안의 위젯 렌더 줄은 그대로 둔다.

Run: `grep -rn "maxWidth=\|min-h-screen p-4" src/app`
Expected: 출력 없음

- [ ] **Step 6: 루트 레이아웃 교체**

`src/app/layout.tsx`:
- import에서 `MobileNav`, `AppChrome` 제거. `import { AppShell } from '@/widgets/app-shell/ui/app-shell';` 추가
- `import type { Metadata } from 'next';` → `import type { Metadata, Viewport } from 'next';`
- `metadata` 아래에 추가:
```ts
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFFFFF',
};
```
- body 내용:
```tsx
        <QueryProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            {isLocalAdapter() && <DevRoleSwitcher />}
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </QueryProvider>
```
`viewportFit: 'cover'`가 없으면 iOS에서 `env(safe-area-inset-*)`가 0이 된다.

- [ ] **Step 7: 옛 셸 삭제**

```bash
git rm src/shared/ui/app-chrome.tsx src/shared/components/mobile-nav.tsx
```
Run: `grep -rn "app-chrome\|mobile-nav\|AppChrome\|MobileNav" src e2e`
Expected: 출력 없음

- [ ] **Step 8: 게이트**

Run: `pnpm lint && pnpm type-check && pnpm test && pnpm build`
Expected: 통과. 실패 시 대부분 Step 5에서 놓친 `maxWidth` 사용처다.

- [ ] **Step 9: 커밋**

```bash
git add -A src/app src/shared/ui src/shared/components src/widgets/app-shell
git commit -m "feat(ui): AppShell로 루트 레이아웃 교체, 옛 크롬·모바일 내비 삭제"
```

---

### Task 7: 더보기 페이지 + GroupedList

**Files:**
- Create: `src/shared/ui/grouped-list.tsx`, `src/shared/ui/grouped-list.test.tsx`, `src/widgets/more/ui/more-page-content.tsx`, `src/widgets/more/ui/more-page-content.test.tsx`, `src/app/more/page.tsx`
- Modify: `src/middleware.ts:6`, `src/middleware.test.ts`

**Interfaces:**
- Consumes: `MORE_GROUPS`, `visibleGroups` (Task 2), `useSignOut`, `ROLE_LABELS` (Task 5), `useAuth()`
- Produces:
```tsx
GroupedList({ label?: string; children: ReactNode })
GroupedListItem(props: { icon: LucideIcon; label: string; description?: string; tone?: 'default' | 'danger' } & ({ href: string } | { onClick: () => void; disabled?: boolean }))
```

- [ ] **Step 1: GroupedList 실패 테스트**

`src/shared/ui/grouped-list.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bell, LogOut } from 'lucide-react';
import { GroupedList, GroupedListItem } from '@/shared/ui/grouped-list';

describe('GroupedList', () => {
  it('라벨과 링크 항목을 렌더한다', () => {
    render(
      <GroupedList label="클럽">
        <GroupedListItem icon={Bell} label="공지" href="/announcements" />
      </GroupedList>,
    );
    expect(screen.getByRole('heading', { name: '클럽' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '공지' })).toHaveAttribute('href', '/announcements');
  });

  it('href 없이 onClick이면 버튼으로 렌더한다', async () => {
    const onClick = vi.fn();
    render(
      <GroupedList>
        <GroupedListItem icon={LogOut} label="로그아웃" tone="danger" onClick={onClick} />
      </GroupedList>,
    );
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run src/shared/ui/grouped-list.test.tsx`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/shared/ui/grouped-list.tsx`:
```tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export function GroupedList({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      {label && <h2 className="px-1 text-xs font-bold text-ink-dim">{label}</h2>}
      <ul className="divide-y divide-border overflow-hidden rounded-[14px] border border-border bg-background">{children}</ul>
    </section>
  );
}

type GroupedListItemProps = {
  icon: LucideIcon;
  label: string;
  description?: string;
  tone?: 'default' | 'danger';
} & ({ href: string } | { onClick: () => void; disabled?: boolean });

export function GroupedListItem(props: GroupedListItemProps) {
  const { icon: Icon, label, description, tone = 'default' } = props;
  const className = 'flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-sunken disabled:opacity-50';
  const body = (
    <>
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-sunken-strong">
        <Icon size={18} aria-hidden className={tone === 'danger' ? 'text-signal-red-fg' : 'text-ink-muted'} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-[15px] font-semibold', tone === 'danger' ? 'text-signal-red-fg' : 'text-ink')}>{label}</span>
        {description && <span className="block text-xs text-ink-dim">{description}</span>}
      </span>
      {'href' in props && <ChevronRight size={18} aria-hidden className="text-ink-faint" />}
    </>
  );

  return (
    <li>
      {'href' in props ? (
        <Link href={props.href} className={className}>{body}</Link>
      ) : (
        <button type="button" onClick={props.onClick} disabled={props.disabled} className={className}>{body}</button>
      )}
    </li>
  );
}
```

Run: `pnpm vitest run src/shared/ui/grouped-list.test.tsx`
Expected: PASS

- [ ] **Step 4: 더보기 위젯 실패 테스트**

`src/widgets/more/ui/more-page-content.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MorePageContent } from '@/widgets/more/ui/more-page-content';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const auth = vi.hoisted(() => ({
  isAdmin: false,
  member: { name: '이서준' },
  profile: { role: 'member' as 'member' | 'admin' | 'superadmin' },
}));
vi.mock('@/providers/auth-provider', () => ({ useAuth: () => auth }));

afterEach(() => {
  __setApiForTests(null);
  router.push.mockClear();
  auth.isAdmin = false;
  auth.profile = { role: 'member' };
});

describe('MorePageContent', () => {
  it('프로필과 멤버용 메뉴를 보여준다', () => {
    const { wrapper } = setupTestApi();
    render(<MorePageContent />, { wrapper });
    expect(screen.getByRole('heading', { level: 1, name: '더보기' })).toBeInTheDocument();
    expect(screen.getByText('이서준')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '공지' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '내 정보' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '멤버' })).toBeNull();
  });

  it('관리자에게는 운영 메뉴가 보인다', () => {
    auth.isAdmin = true;
    auth.profile = { role: 'admin' };
    const { wrapper } = setupTestApi();
    render(<MorePageContent />, { wrapper });
    expect(screen.getByRole('link', { name: '멤버' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '전략·팀 편성' })).toBeInTheDocument();
  });

  it('로그아웃하면 /login으로 보낸다', async () => {
    const { api, wrapper } = setupTestApi();
    await api.auth.signInAsDemo('member');
    render(<MorePageContent />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(await api.auth.getUser()).toBeNull();
    expect(router.push).toHaveBeenCalledWith('/login');
  });
});
```

Run: `pnpm vitest run src/widgets/more`
Expected: FAIL — 모듈 없음

- [ ] **Step 5: 위젯과 라우트 구현**

`src/widgets/more/ui/more-page-content.tsx`:
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { ROLE_LABELS } from '@/entities/auth/model/labels';
import { useSignOut } from '@/entities/auth/model/queries';
import { useAuth } from '@/providers/auth-provider';
import { MORE_GROUPS, visibleGroups } from '@/shared/config/navigation';
import { GroupedList, GroupedListItem } from '@/shared/ui/grouped-list';

export function MorePageContent() {
  const router = useRouter();
  const { member, profile, isAdmin } = useAuth();
  const signOut = useSignOut();
  const groups = visibleGroups(MORE_GROUPS, isAdmin);

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[19px] font-bold text-ink">더보기</h1>

      <div className="flex items-center gap-3 rounded-2xl bg-brand-soft p-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-bold text-ink">
          {member?.name.slice(0, 1) ?? '?'}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-ink">{member?.name ?? '이름 없음'}</p>
          {profile && <p className="text-sm text-brand-dark">{ROLE_LABELS[profile.role]}</p>}
        </div>
      </div>

      {groups.map((group) => (
        <GroupedList key={group.label ?? 'main'} label={group.label ?? undefined}>
          {group.items.map((item) => (
            <GroupedListItem key={item.href} icon={item.icon} label={item.label} href={item.href} />
          ))}
          {group.label === '계정' && (
            <GroupedListItem icon={LogOut} label="로그아웃" tone="danger" onClick={handleSignOut} disabled={signOut.isPending} />
          )}
        </GroupedList>
      ))}
    </div>
  );
}
```

`src/app/more/page.tsx`:
```tsx
import { AppPageLayout } from '@/shared/ui/app-page-layout';
import { MorePageContent } from '@/widgets/more/ui/more-page-content';

export default function MorePage() {
  return (
    <AppPageLayout width="narrow">
      <MorePageContent />
    </AppPageLayout>
  );
}
```

Run: `pnpm vitest run src/widgets/more`
Expected: PASS

- [ ] **Step 6: 미들웨어 보호 — 실패 테스트**

`src/middleware.test.ts`의 `describe('middleware (local adapter)')`에서 `'공개 라우트는 쿠키 없이 통과한다'` 테스트를 아래 두 개로 교체:
```ts
  it('루트(/)는 쿠키 없이 통과한다(페이지가 /dashboard로 보낸다)', async () => {
    expect((await middleware(request('/'))).status).toBe(200);
  });

  it('/more와 /club-guide는 로그인이 필요하다', async () => {
    for (const path of ['/more', '/club-guide']) {
      const res = await middleware(request(path));
      expect(res.headers.get('location')).toBe(`http://localhost/login?next=${encodeURIComponent(path)}`);
    }
  });
```

Run: `pnpm vitest run src/middleware.test.ts`
Expected: FAIL — `/more`가 200

- [ ] **Step 7: 미들웨어 수정**

`src/middleware.ts` 6행:
```ts
const protectedRoutes = ['/dashboard', '/attendance', '/votes', '/matches', '/members', '/team-division', '/me', '/announcements', '/strategy', '/more', '/club-guide'];
```

Run: `pnpm vitest run src/middleware.test.ts`
Expected: PASS

- [ ] **Step 8: 게이트 + 커밋**

Run: `pnpm lint && pnpm type-check && pnpm test`
Expected: 통과

```bash
git add src/shared/ui/grouped-list.tsx src/shared/ui/grouped-list.test.tsx src/widgets/more src/app/more src/middleware.ts src/middleware.test.ts
git commit -m "feat(ui): 더보기 페이지와 GroupedList, /more·/club-guide 보호"
```

---

### Task 8: 랜딩 제거

**Files:**
- Modify: `src/app/page.tsx`, `e2e/_setup/auth.setup.ts:13`, `e2e/smoke/route-sweep.spec.ts:22-33,86-100`
- Delete: `src/widgets/home/ui/home-page-content.tsx`, `src/widgets/home/ui/mobile-landing-carousel.tsx`, `src/widgets/home/ui/ai-scene-card.tsx`, `src/widgets/home/ui/reveal-section.tsx`

**Interfaces:** 없음(삭제 작업). `club-guide-page-content.tsx`는 남긴다(단계 5에서 재작성).

- [ ] **Step 1: 루트 페이지를 리다이렉트로**

`src/app/page.tsx` 전체:
```tsx
import { redirect } from 'next/navigation';

/** 클럽 내부용 앱이라 랜딩이 없다. 비로그인이면 미들웨어가 /dashboard를 /login으로 보낸다. */
export default function RootPage() {
  redirect('/dashboard');
}
```

- [ ] **Step 2: 랜딩 위젯 삭제와 참조 확인**

```bash
git rm src/widgets/home/ui/home-page-content.tsx src/widgets/home/ui/mobile-landing-carousel.tsx src/widgets/home/ui/ai-scene-card.tsx src/widgets/home/ui/reveal-section.tsx
```
Run: `grep -rn "home-page-content\|mobile-landing-carousel\|ai-scene-card\|reveal-section" src e2e`
Expected: 출력 없음

Run: `grep -rln "from ['\"]motion" src`
Expected: 출력이 없으면 `motion` 의존성은 이제 미사용이다. **이번 태스크에서 제거하지 않는다**(다른 화면 재작성에서 쓸지 단계 2에서 판단). 결과만 커밋 메시지 본문에 기록한다.

- [ ] **Step 3: e2e 갱신**

`e2e/_setup/auth.setup.ts`의 `ROUTES_TO_WARM`에서 `'/'`를 `'/more'`로 바꾼다:
```ts
const ROUTES_TO_WARM = ['/votes', '/matches', '/members', '/attendance', '/announcements', '/me', '/strategy', '/club-guide', '/more'];
```

`e2e/smoke/route-sweep.spec.ts`:
- `STATIC_ROUTES`에서 `{ path: '/' },` 줄을 `{ path: '/more', heading: '더보기' },`로 바꾼다. 위 JSDoc의 랜딩 설명 문장("랜딩(`/`)은 자동 전환 캐러셀이라…")을 삭제한다.
- 테스트 이름 `'정적 라우트 10곳'`은 그대로 10곳이므로 유지.
- `'리다이렉트 라우트 3곳'` 테스트 본문 맨 앞에 추가하고 이름을 `'리다이렉트 라우트 4곳'`으로 바꾼다:
```ts
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page).toHaveURL(/\/dashboard$/);

```

- [ ] **Step 4: 게이트 + 커밋**

Run: `pnpm lint && pnpm type-check && pnpm test && pnpm build`
Expected: 통과

```bash
git add -A src/app/page.tsx src/widgets/home e2e
git commit -m "feat(ui): 랜딩 제거, /는 대시보드로 리다이렉트"
```

---

### Task 9: DEMO 칩 + Drawer 장식 제거

**Files:**
- Modify: `src/shared/ui/drawer.tsx`, `src/features/dev-session/ui/dev-role-switcher.tsx`, `src/features/dev-session/ui/dev-role-switcher.test.tsx`
- Possibly modify: `vitest.setup.ts` (Step 3 조건부)

**Interfaces:**
- Consumes: `Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerDescription` (`@/shared/ui/drawer`), `getApi`, `resetLocalData`, `DEMO_ACCOUNTS`
- Produces: `DevRoleSwitcher()` — 트리거 버튼 `aria-label="데모 메뉴 열기"`, 시트 안 버튼 이름: 각 `DEMO_ACCOUNTS[key].label`, `로그아웃`, `데이터 초기화`, 확인 단계 `초기화 실행`

- [ ] **Step 1: 테스트를 새 상호작용으로 갱신(실패)**

`src/features/dev-session/ui/dev-role-switcher.test.tsx` 전체:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DevRoleSwitcher } from '@/features/dev-session/ui/dev-role-switcher';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

const push = vi.fn();
const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));

const toastError = vi.fn();
vi.mock('sonner', () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }));

async function openSheet() {
  await userEvent.click(screen.getByRole('button', { name: '데모 메뉴 열기' }));
}

describe('DevRoleSwitcher', () => {
  afterEach(() => {
    __setApiForTests(null);
    push.mockClear();
    refresh.mockClear();
    toastError.mockClear();
  });

  it('처음에는 칩만 보이고 계정 버튼은 숨어 있다', () => {
    const { wrapper } = setupTestApi();
    render(<DevRoleSwitcher />, { wrapper });
    expect(screen.getByRole('button', { name: '데모 메뉴 열기' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '관리자' })).toBeNull();
  });

  it('계정 버튼을 누르면 데모 로그인 후 /dashboard로 이동한다', async () => {
    const { api, wrapper } = setupTestApi();
    render(<DevRoleSwitcher />, { wrapper });
    await openSheet();
    await userEvent.click(await screen.findByRole('button', { name: '관리자' }));
    expect((await api.auth.getUser())?.id).toBe('u-admin');
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('로그아웃 버튼은 세션을 지우고 /login으로 보낸다', async () => {
    const { api, wrapper } = setupTestApi();
    await api.auth.signInAsDemo('member');
    render(<DevRoleSwitcher />, { wrapper });
    await openSheet();
    await userEvent.click(await screen.findByRole('button', { name: '로그아웃' }));
    expect(await api.auth.getUser()).toBeNull();
    expect(push).toHaveBeenCalledWith('/login');
  });

  it('데이터 초기화는 확인 단계를 거친다', async () => {
    const { api, wrapper } = setupTestApi();
    await api.auth.signInAsDemo('member');
    render(<DevRoleSwitcher />, { wrapper });
    await openSheet();
    await userEvent.click(await screen.findByRole('button', { name: '데이터 초기화' }));
    expect(await api.auth.getUser()).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: '초기화 실행' }));
    expect(await api.auth.getUser()).toBeNull();
    expect(push).toHaveBeenCalledWith('/login');
  });

  it('데모 계정 전환이 실패하면 토스트로 알리고 이동하지 않는다', async () => {
    const { api, wrapper } = setupTestApi();
    api.auth.signInAsDemo = vi.fn().mockRejectedValue(new Error('데모 계정 u-superadmin이(가) 시드에 없습니다.'));
    render(<DevRoleSwitcher />, { wrapper });
    await openSheet();
    await userEvent.click(await screen.findByRole('button', { name: '슈퍼관리자' }));
    expect(toastError).toHaveBeenCalledWith('데모 계정 u-superadmin이(가) 시드에 없습니다.');
    expect(push).not.toHaveBeenCalled();
  });
});
```

Note: 원래 테스트의 "초기화"는 `resetLocalData()`가 IndexedDB를 비운다. 메모리 어댑터 테스트에서는 `__setApiForTests`가 `localStorageRef`를 `null`로 두므로 `resetLocalData()`가 아무것도 하지 않는다(`src/shared/api/client.ts:48-51`). 그래서 세션 제거 여부만 단언한다.

Run: `pnpm vitest run src/features/dev-session`
Expected: FAIL — `데모 메뉴 열기` 버튼 없음

- [ ] **Step 2: `drawer.tsx` 장식 제거**

`src/shared/ui/drawer.tsx`:
- `DrawerOverlay`의 className 기본값 → `"fixed inset-0 z-[110] bg-black/40"`
- `DrawerContent`의 `DrawerPrimitive.Content` className 기본값 → `"fixed inset-x-0 bottom-0 z-[120] mt-24 flex max-h-[94dvh] flex-col rounded-t-[20px] border-t border-border bg-background"`
- 그 안의 핸들 div는 유지하되 className → `"mx-auto mt-3 h-1.5 w-10 rounded-full bg-sunken-strong"`
- 금색 그라데이션 div(`pointer-events-none absolute inset-x-0 top-0 h-28 …`) **삭제**
- 스크롤 영역 div className → `"relative flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4"`
- 닫기 버튼 className → `"absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:bg-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"`, 내부 `<span className="sr-only">Close</span>` → `닫기`

이 Drawer는 투표 응답·출석·경기 기록·멤버·공지 등 여러 기능이 쓴다. 옛 화면의 시트가 흰 배경으로 바뀌는 것은 의도된 변화다.

- [ ] **Step 3: DEMO 칩 구현**

`src/features/dev-session/ui/dev-role-switcher.tsx` 전체:
```tsx
'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { getApi, resetLocalData } from '@/shared/api/client';
import { DEMO_ACCOUNTS, type DemoAccountKey } from '@/shared/api/ports/auth-repo';
import { Button } from '@/shared/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/shared/ui/drawer';

const ACCOUNT_KEYS: DemoAccountKey[] = ['member', 'admin', 'superadmin', 'unlinked'];

/**
 * 로컬 어댑터 전용. 우하단 작은 칩 → 시트에서 데모 계정 전환·로그아웃·데이터 초기화.
 * 모바일에서는 탭바(56px) 위 12px에 띄워 탭과 겹치지 않게 한다. Supabase 모드에서는 렌더하지 않는다.
 */
export function DevRoleSwitcher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const run = async (action: () => Promise<void>, nextPath: string) => {
    setBusy(true);
    try {
      await action();
      queryClient.clear();
      setOpen(false);
      router.push(nextPath);
      router.refresh();
    } catch (error) {
      // 시드에 없는 데모 계정 등으로 실제 throw가 난다. 조용히 삼키면 버튼이 먹통으로 보인다.
      toast.error(error instanceof Error ? error.message : '데모 세션 전환에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setConfirmReset(false);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label="데모 메뉴 열기"
          className="fixed right-3 z-50 flex h-8 items-center rounded-full border border-signal-amber-fg/30 bg-signal-amber-bg px-3 text-xs font-bold text-signal-amber-fg bottom-[calc(56px+12px+env(safe-area-inset-bottom))] md:bottom-4"
        >
          DEMO
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>데모 모드</DrawerTitle>
          <DrawerDescription>화면 미리보기입니다. 입력한 내용은 이 기기에만 남고 다른 사람에게 보이지 않습니다.</DrawerDescription>
        </DrawerHeader>

        <div className="mt-4 space-y-5">
          <section className="space-y-2">
            <h3 className="text-xs font-bold text-ink-dim">계정 전환</h3>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_KEYS.map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  className="h-11"
                  disabled={busy}
                  onClick={() => run(async () => { await getApi().auth.signInAsDemo(key); }, '/dashboard')}
                >
                  {DEMO_ACCOUNTS[key].label}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <Button variant="outline" className="h-11 w-full" disabled={busy} onClick={() => run(() => getApi().auth.signOut(), '/login')}>
              로그아웃
            </Button>
            {confirmReset ? (
              <div className="space-y-2 rounded-xl bg-signal-red-bg p-3">
                <p className="text-sm text-signal-red-fg">시드 데이터로 되돌리고 로그아웃합니다.</p>
                <Button
                  variant="destructive"
                  className="h-11 w-full"
                  disabled={busy}
                  onClick={() => run(async () => { await getApi().auth.signOut(); await resetLocalData(); }, '/login')}
                >
                  초기화 실행
                </Button>
              </div>
            ) : (
              <Button variant="ghost" className="h-11 w-full text-signal-red-fg" disabled={busy} onClick={() => setConfirmReset(true)}>
                데이터 초기화
              </Button>
            )}
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

`Button`의 `variant` 목록에 `outline`/`ghost`/`destructive`가 있는지 `src/shared/ui/button.tsx`에서 확인한다(shadcn 기본값이면 있다). 없는 variant는 가장 가까운 것으로 바꾼다.

Run: `pnpm vitest run src/features/dev-session`
Expected: PASS. **jsdom에서 vaul이 `window.matchMedia is not a function` 등으로 실패하면** `vitest.setup.ts` 끝에 아래를 추가하고 다시 실행한다:
```ts
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
```
다른 오류로 실패하면 추측으로 우회하지 말고 오류 전문과 함께 보고한다.

- [ ] **Step 4: 게이트 + 커밋**

Run: `pnpm lint && pnpm type-check && pnpm test`
Expected: 통과

```bash
git add src/shared/ui/drawer.tsx src/features/dev-session vitest.setup.ts
git commit -m "feat(ui): DEMO 스위처를 칩+시트로, Drawer 장식 제거"
```

---

### Task 10: 셸 시각 검증 e2e + 모바일 라우트 스윕 + 오너 보고용 캡처

**Files:**
- Modify: `playwright.config.ts`
- Create: `e2e/visual/shell.spec.ts`

**Interfaces:**
- Consumes: 탭바 `navigation[name="주요 메뉴"]`, 사이드바 `navigation[name="사이드 메뉴"]`, DEMO 칩 `button[name="데모 메뉴 열기"]`, 루트 페이지 h1
- Produces: e2e 프로젝트 `mobile`/`desktop`에서 도는 `shell.spec.ts`, `E2E_PORT` 환경변수

- [ ] **Step 1: 포트 설정 가능하게**

`playwright.config.ts`:
- `export const STORAGE_DIR = …` 아래에 추가:
```ts
/** 이 머신의 3000번에는 다른 프로젝트 서버가 떠 있을 수 있다. 로컬에서는 E2E_PORT=3100 pnpm e2e 처럼 쓴다. */
const PORT = Number(process.env.E2E_PORT ?? 3000);
```
- `baseURL: 'http://localhost:3000'` → `` baseURL: `http://localhost:${PORT}` ``
- `webServer.command` → `` process.env.CI ? `pnpm start --port ${PORT}` : `pnpm dev --port ${PORT}` ``
- `webServer.url` → `` `http://localhost:${PORT}` ``
- mobile 프로젝트에서 `testIgnore: /route-sweep\.spec\.ts/,` 삭제
- mobile/desktop 위 주석(라우트 스윕을 desktop에서만 돌리는 이유) 삭제 — 원인이던 하단 내비 가림이 해결됐다

`e2e/smoke/route-sweep.spec.ts` 상단 JSDoc의 "이 스펙은 desktop 프로젝트에서만 돈다(…)" 문단을 삭제한다.

- [ ] **Step 2: 시각 검증 스펙 작성**

`e2e/visual/shell.spec.ts`:
```ts
import { test, expect, type Page, type TestInfo } from '@playwright/test';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

const ROUTES = ['/dashboard', '/votes', '/matches', '/attendance', '/more', '/announcements', '/members', '/me', '/strategy', '/club-guide'];

type Box = { x: number; y: number; width: number; height: number };

function intersects(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

async function capture(page: Page, testInfo: TestInfo, route: string, suffix: string) {
  const file = testInfo.outputPath(`${testInfo.project.name}-${suffix}${route.replace(/\//g, '_')}.png`);
  await page.screenshot({ path: file });
  await testInfo.attach(`${suffix}${route}`, { path: file, contentType: 'image/png' });
}

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

test.describe('앱 셸이 콘텐츠를 가리지 않는다', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  test('모바일: 탭바·DEMO 칩·가로 스크롤', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', '모바일 프로젝트 전용');

    for (const route of ROUTES) {
      await test.step(route, async () => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        await capture(page, testInfo, route, 'top');
        await expectNoHorizontalScroll(page);

        const tabBar = page.getByRole('navigation', { name: '주요 메뉴' });
        await expect(tabBar).toBeVisible();
        const tabBox = (await tabBar.boundingBox())!;

        const chip = page.getByRole('button', { name: '데모 메뉴 열기' });
        const chipBox = (await chip.boundingBox())!;
        expect(intersects(chipBox, tabBox), 'DEMO 칩이 탭바와 겹친다').toBe(false);

        const heading = page.getByRole('heading', { level: 1 }).first();
        if (await heading.isVisible()) {
          expect(intersects(chipBox, (await heading.boundingBox())!), 'DEMO 칩이 페이지 제목과 겹친다').toBe(false);
        }

        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(300);
        const contentBottom = await page.evaluate(() => {
          const main = document.querySelector('main');
          const last = main?.lastElementChild as HTMLElement | null;
          return last ? last.getBoundingClientRect().bottom : 0;
        });
        expect(contentBottom, '마지막 콘텐츠가 탭바 아래로 들어간다').toBeLessThanOrEqual(tabBox.y + 1);
        await capture(page, testInfo, route, 'bottom');
      });
    }
  });

  for (const width of [1024, 1440]) {
    test(`데스크톱 ${width}px: 사이드바·가로 스크롤`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', '데스크톱 프로젝트 전용');
      await page.setViewportSize({ width, height: 900 });

      for (const route of ROUTES) {
        await test.step(route, async () => {
          await page.goto(route);
          await page.waitForLoadState('networkidle');
          await expect(page.getByRole('navigation', { name: '사이드 메뉴' })).toBeVisible();
          await expect(page.getByRole('navigation', { name: '주요 메뉴' })).toBeHidden();
          await expectNoHorizontalScroll(page);
          await capture(page, testInfo, route, `w${width}`);
        });
      }
    });
  }
});
```

Note: `'../../playwright.config'` 상대 import는 기존 e2e 파일과 같은 방식이다(ESLint 상대 import 규칙은 `src/**`에만 걸린다).

- [ ] **Step 3: 포트 확인 후 e2e 실행**

Run: `lsof -i :3000 -sTCP:LISTEN; lsof -i :3100 -sTCP:LISTEN`
- 3000에 **이 레포가 아닌** 서버가 떠 있으면(해당 PID의 `lsof -p <PID> | grep cwd`로 확인) 3100을 쓴다. 3100도 사용 중이면 비어 있는 다른 포트를 고른다.

Run: `E2E_PORT=3100 pnpm e2e`
Expected: 전부 통과. 새로 도는 항목: `shell.spec.ts` 모바일 1 + 데스크톱 2, mobile 프로젝트의 `route-sweep.spec.ts` 3.

실패 처리:
- `shell.spec.ts`의 **가로 스크롤** 실패는 옛 화면 본문(예: 넓은 표)이 원인일 수 있다. 원인 요소를 `page.evaluate`로 찾아(`[...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > innerWidth)`) 셸 문제면 고치고, 옛 화면 본문 문제면 **해당 라우트·요소를 보고**하고 멈춘다(단계 4 범위 판단은 컨트롤러가 한다).
- mobile `route-sweep` 실패도 같은 원칙: 셸이 원인(가림·클릭 가로채기)이면 고치고, 옛 본문이 원인이면 보고.

- [ ] **Step 4: 전체 게이트**

Run: `pnpm lint && pnpm type-check && pnpm test && pnpm build && E2E_PORT=3100 pnpm e2e`
Expected: 전부 통과, lint 경고 ≤ 4

- [ ] **Step 5: 커밋**

```bash
git add playwright.config.ts e2e
git commit -m "test(e2e): 셸 시각 검증(모바일·1024·1440), 라우트 스윕 모바일 활성화, E2E_PORT"
```

- [ ] **Step 6: 오너 보고용 캡처 정리**

Run: `find test-results -name '*.png' -path '*shell*' | sort`
모바일 `top`/`bottom` 쌍과 데스크톱 1024/1440 캡처 중 **홈·투표·경기·더보기·멤버 상세가 아닌 목록 1개**를 골라 경로를 보고에 포함한다. 보고에는 "단계 1은 셸만 바뀌고 본문은 옛 화면 그대로인 의도된 중간 상태"임을 명시한다.

---

## Self-Review

**Spec coverage (A-6 단계 1 = 토큰 + 셸 + DEMO 칩 + 랜딩 제거):**
- A-1 토큰 값·shadcn 매핑·대비 테스트 → Task 1
- A-1 Pretendard, `tabular-nums` → Task 1 (폰트). `tabular-nums`는 숫자를 그리는 컴포넌트에서 적용하므로 단계 2(공용 컴포넌트)·4(화면)에서 다룬다
- A-2 탭 5개·활성 표현·safe-area → Task 2, 4, 6
- A-2 헤더 규칙(홈/루트 없음/깊은 화면)·`usePageHeader` → Task 2, 3, 4, 5
- A-2 데스크톱 사이드바 232·상단바 52·본문 1120·패딩 24 → Task 5, 6
- A-2 더보기 페이지·그룹 구성 → Task 2, 7
- A-2 DEMO 칩 위치·시트·확인 단계·D-05 문구 → Task 9
- A-2 랜딩 제거·`/` 리다이렉트·`/club-guide` 로그인 필요 → Task 7(보호), 8. 클럽 안내 **본문 재작성**과 OG 문구 단순화는 A-6 단계 5 범위라 이 계획에 없다
- A-3 중 `GroupedList` → Task 7(더보기가 필요로 해 앞당김). 나머지 컴포넌트·ESLint 금지 규칙·`editorial-*` 제거 → 단계 2 계획
- A-5 시각 회귀(가로 스크롤·탭바 가림·DEMO 겹침·1024 사이드바)·모바일 라우트 스윕 → Task 10

**Placeholder scan:** 조건부 단계 1곳(Task 9 matchMedia 스텁)은 구체 코드와 판단 기준을 포함한다. 전제 사실(`AppRole` 유니온, `resetLocalData` 테스트 동작, 기존 테스트 import, Button variant 이름)은 코드로 확인했다.

**Type consistency:** `resolveRouteMeta` 반환 `{ title, kind, backHref }` — Task 2 정의, Task 4·5·6에서 동일 필드 사용. `usePageHeaderStore(state => state.override)` / `setOverride` / `clearOverride` — Task 3 정의와 Task 4 테스트 일치. `useSignOut().mutateAsync()` / `.isPending` — Task 5 정의, Task 7 사용. `AppPageLayout`의 `width` — Task 6 정의, Task 7 사용. `GroupedListItem`의 `href | onClick` 유니온 — Task 7 내부 일치.
