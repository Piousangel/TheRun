# UI 개편 설계 — 앱 셸·토큰·공용 컴포넌트·화면 재작성

- 작성: 2026-09-17 / 상태: 승인됨(브레인스토밍) → 구현 계획 대기
- 짝 문서: `2026-09-17-own-login-invite-design.md` (로그인·가입·재설정의 동작)
- 결정 기록: `docs/product-decisions.md` D-07
- 기준: `car-rental-backoffice` `develop`의 **실제 모바일 코드**(`src/app/(mobile)/m/**`, `src/widgets/mobile-layout/**`). 같은 레포의 디자인 시안(`docs/design-assets-p5`)은 QA 5회차에서 그라데이션 헤더·KPI 카드가 제거됐으므로 기준이 아니다.

## 0. 왜 하는가 (2026-09-17 실측)

배포본을 iPhone 13 / 1440px로 캡처한 결과:
- 모바일 하단 내비 실높이 약 160px — 탭 줄(80px) 위에 "THE RUN · Weekly club flow · MOBILE READY" 장식 바가 붙어 콘텐츠와 카드 클릭을 덮는다
- `DevRoleSwitcher`가 `fixed top-2 right-2`로 모든 화면 제목과 데스크톱 헤더를 덮는다
- 관리자 하단 탭이 홈·공지·멤버·투표 — **경기·출석이 더보기 안에 있다**
- 대시보드 모바일 세로 길이 6,593px. 첫 화면은 히어로 문구 + "멤버 20" 카드뿐
- 로그인 첫 화면에 로그인 버튼이 없다. "Runner mark first, weekly flow second" 같은 설계 메모가 사용자에게 노출된다
- 사이드바가 `xl`(1280px)부터라 768~1279px에서는 내비게이션이 없다
- `PageHero` 12개 화면, `StatTile` 13개 화면, 자간 넓은 영어 대문자 라벨 29개 파일

## A-1. 원칙과 토큰

### 원칙
1. **첫 화면 = 할 일.** 히어로·KPI 타일·영어 라벨·설계 의도 문구 금지.
2. **카드는 테두리만.** 그림자·그라데이션·`backdrop-blur` 금지. 예외: 시트/팝오버/토스트.
3. **강조색은 금색 하나.** 상태는 fg/bg 페어 팔레트로만.
4. **모호한 문구 금지, 내부 상태 키 노출 금지.** 모든 상태 표시는 라벨 맵을 거친다.
5. **라이트 모드만.** `.dark` 토큰과 대시보드 다크 섹션 제거.

### 토큰 (`src/app/globals.css` 재정의, Tailwind 테마에 연결)

| 역할 | 토큰 | 값 |
|---|---|---|
| 배경 | `--bg` / `--bg-sunken` / `--bg-sunken-strong` | `#FFFFFF` / `#F8F9FA` / `#F1F3F5` |
| 테두리 | `--border` / `--border-strong` | `#E9ECEF` / `#DEE2E6` |
| 텍스트 | `--fg` / `--fg-muted` / `--fg-dim` / `--fg-faint` | `#212529` / `#495057` / `#687078` / `#ADB5BD` |
| | | `--fg-dim`은 백오피스의 `#868E96`(흰 배경 대비 3.32:1)을 **4.5:1 이상**이 되도록 어둡게 조정한 값. `--fg-faint`는 대비 미달이므로 **텍스트에 쓰지 않는다**(장식 아이콘·비활성 테두리 전용) |
| 브랜드 | `--brand` (버튼 면) | `#C8A858` — 위 글자는 `--fg`(검정) |
| | `--brand-dark` (텍스트·활성 탭·링크) | `#8A6D1F` (흰 배경 대비 ≥ 4.5:1) |
| | `--brand-soft` (활성 배경) | `#FBF6E9` |
| 신호 red | fg / bg | `#B91C1C` / `#FFF5F5` |
| 신호 amber | | `#B45309` / `#FEF3C7` |
| 신호 blue | | `#1F6FB8` / `#E8F1FA` |
| 신호 green | | `#00755B` / `#E6F5F2` (백오피스 `#00876A`는 이 배경에서 4.00:1이라 어둡게 조정) |
| 신호 gray | | `#475569` / `#F1F5F9` |

shadcn 변수(`--primary`, `--muted` 등)는 위 토큰을 참조하도록 매핑해 기존 `Button`/`Input` 등이 자동으로 새 규격을 따르게 한다. `--primary-foreground`는 검정.

**구현 시 확인:** `#8A6D1F`/흰색, `#212529`/`#C8A858`의 대비비를 테스트로 고정(`src/shared/lib/__tests__/contrast.test.ts`, WCAG 공식). 4.5:1 미만이면 값을 조정한다.

| 항목 | 값 |
|---|---|
| 반경 | 리스트 카드 14 / 행 카드 12 / 배지 10 / 버튼·입력 10 / 시트 상단 20 |
| 폰트 | Pretendard Variable(`next/font/local` 또는 CDN 셀프호스트). 숫자(점수·시각·날짜·인원)는 `tabular-nums` |
| 타입 | 헤더 제목 17/700 · 섹션 제목 19/700 · 카드 1행 15/600 · 보조 13 `--fg-muted` · 메타 12 `--fg-dim` · 그룹 라벨 12/700 `--fg-dim` |
| 간격 | 페이지 좌우 16 · 섹션 간 24 · 카드 간 8 · 카드 내부 16 |
| 터치 | 최소 44×44 |

## A-2. 셸

### 모바일 (`< md`, 768px 미만)
```
<div class="min-h-dvh bg-[--bg]">
  <MobileTopBar/>            // 조건부, sticky top
  <main style="padding-bottom: calc(56px + env(safe-area-inset-bottom))">
  <MobileTabBar/>            // fixed bottom, 56px + safe-area
</div>
```
**스크롤 모델(구현 계획 단계에서 조정):** 백오피스는 `h-dvh` + `<main>` 내부 스크롤이지만, TheRun은 **문서(window) 스크롤을 유지**한다. 기존 화면들의 sticky/fixed 요소·전술보드 좌표 계산·Playwright 스크롤이 전부 window 기준이라, 스크롤 컨테이너를 바꾸면 단계 1에서 옛 화면이 대량으로 깨진다. 채팅 입력처럼 `h-dvh`가 필요한 화면이 생기면 그 화면만 전용 레이아웃을 쓴다.
- **탭바**: `grid-cols-5`, 각 칸 `min-h-[56px]`, 아이콘 22 + 라벨 11px. 활성 = `--brand-dark` + 700, 비활성 = `--fg-muted` + 500. 배경 흰색, 상단 1px 테두리. 활성 pill·그림자 없음.
- **탭 구성(역할 무관 동일)**: 홈 `/dashboard` · 투표 `/votes` · 경기 `/matches` · 출석 `/attendance` · 더보기 `/more`
- **더보기 `/more`** (시트가 아닌 페이지): 프로필 카드(이름·역할 배지) → 그룹 리스트
  - 클럽: 공지 · 클럽 안내
  - 운영(관리자만): 멤버 · 전략·팀 편성
  - 계정: 내 정보 · 로그아웃(빨간 글자)
- **헤더 규칙**
  - 홈: 로고 + "○○님" (56px)
  - 탭 루트(투표·경기·출석·더보기): 헤더 없음. 본문 첫 줄에 19/700 페이지 제목. 상단 safe-area는 루트 컨테이너가 받는다.
  - 깊은 화면(상세·생성): 56px 헤더 — 뒤로가기(44×44, `-ml-2`) + 제목 17/700 + 선택적 부제 12 + 우측 액션 슬롯
  - 제목/뒤로가기 대상은 페이지가 `usePageHeader({ title, subtitle?, backHref?, action? })`로 선언한다(Zustand 스토어, 마운트 시 설정·언마운트 시 해제). 같은 선언이 데스크톱 상단바 제목에도 쓰인다.

### 데스크톱 (`≥ md`)
- 사이드바 `fixed w-[232px]`, 흰 배경, 우측 hairline. 상단 52px 로고 → 메뉴(그룹 라벨: 클럽 / 운영) → 하단 내 이름 + 로그아웃. 항목 `h-9 text-[14px] rounded-lg`, 활성 `--brand-soft` 배경 + `--brand-dark` 600.
- 상단바 `h-[52px]` sticky, 현재 페이지 제목 + (깊은 화면이면) 뒤로가기 + 우측 액션 슬롯.
- 본문 `md:ml-[232px]`, 패딩 24, `max-w-[1120px]`.
- 데스크톱 메뉴에는 "더보기"가 없고 모든 항목이 펼쳐진다.

### 라우팅 방식
`/m/*` 분리 라우트를 두지 않는다. **같은 URL, 반응형.** 화면 수(15개 내외) 대비 이중 라우트 유지비가 크다. 모바일/데스크톱 표현이 크게 다른 컴포넌트만 내부에서 분기한다.

### DEMO 스위처 (로컬 어댑터 전용)
- 떠 있는 바 제거. 우하단(탭바 위 `bottom: calc(56px + 12px + safe-area)`, 데스크톱은 `bottom: 16px`) 32px "DEMO" 칩.
- 탭하면 시트: 역할 전환(멤버/관리자/슈퍼관리자), 데이터 초기화(확인 단계 포함). 로컬 모드 안내 문구 1줄(D-05의 "저장된다고 말하지 않기" 원칙 준수).

### 랜딩 제거
- `/`: 로그인 상태면 `/dashboard`, 아니면 `/login`으로 리다이렉트(미들웨어).
- 삭제: `home-page-content.tsx`, `mobile-landing-carousel.tsx`, `ai-scene-card.tsx`, `reveal-section.tsx`, OG 이미지의 마케팅 문구는 단순화.
- `/club-guide`: 로그인 필요 페이지로 바꾸고, 셸 안의 단순 텍스트 문서로 재작성.

## A-3. 공용 컴포넌트 (`src/shared/ui/`)

| 컴포넌트 | 규격 |
|---|---|
| `SectionHeader` | 제목 19/700 + 선택적 우측 링크("전체 보기", 14/500 `--brand-dark`) |
| `ListCard` | 전체가 `Link`. `rounded-[14px] border p-4 flex flex-col gap-2`. 슬롯: `badges`(1행 좌) / `trailing`(1행 우) / `title` / `meta`(좌) / `timestamp`(우, 12 tabular) |
| `ListRow` | `rounded-[12px] border px-4 py-3.5 flex items-center gap-3` + 배지 + 제목 15/600 + 메타 13 + `ChevronRight 18` |
| `GroupedList` | 그룹 라벨 + `rounded-[14px] border overflow-hidden` 컨테이너, 행 `px-4 py-3` 구분선, 34px 아이콘 박스 |
| `StatusBadge` | `h-5 px-2 text-[12px] font-semibold rounded-[10px]`, `tone: red|amber|blue|green|gray|brand`. 도메인별 라벨 맵은 각 entity의 `model/labels.ts`에 두고 배지는 tone만 받는다 |
| `EmptyState` / `ErrorState` | 48px 아이콘 `--fg-faint` + 제목 16/600 + 설명 14(max 320px), `py-12`. Error는 "다시 시도" outline 버튼 |
| `CardSkeleton` | `ListCard`/`ListRow`와 동일 외곽 크기. 목록 기본 4개 |
| `FormSheet` | 모바일: vaul Drawer `h-[94dvh]`, 헤더 / 스크롤 본문 / **하단 고정 푸터**(`h-12` 전폭 주 버튼 + safe-area). 데스크톱: `Dialog` 최대 560px. 기존 생성·수정 폼을 여기에 담는다 |
| `SegmentedControl` | `--bg-sunken` 트랙, 활성 흰 카드. 2~3개 옵션 |
| `usePageHeader` | A-2 참조 |

제거: `PageHero`, `StatTile`, `state-panel.tsx`(Empty/Error로 대체), `globals.css`의 `editorial-hero` 등 장식 유틸리티.
유지하되 토큰만 교체: `Button`, `Input`, `Textarea`, `Select`, `Tabs`, `Dialog`, `Drawer`, `Avatar`, `Badge`(→ 내부적으로 `StatusBadge`로 흡수 검토는 구현 계획에서).

ESLint 추가 규칙(경고가 아닌 error): `shadow-[`, `bg-[linear-gradient`, `backdrop-blur`, `tracking-[0.1`~`0.2` 계열을 `src/widgets`·`src/features`·`src/entities`에서 금지(`no-restricted-syntax`로 className 문자열 검사). 기존 `animate-pulse` 규칙은 `CardSkeleton` 도입과 함께 범위를 정리한다(D 백로그 Phase 2 항목 흡수).

## A-4. 화면별 첫 화면

| 화면 | 구성 (위에서 아래) |
|---|---|
| 홈 · 멤버 | ① **이번 주 경기 투표 카드** — 날짜·장소·마감까지 남은 시간, 참석/불참 버튼 인라인, 내 응답 상태 ② 다음 경기 — 팀 확정 시 내 팀 표시(D-04 전에는 경기 기본 정보만) ③ 최근 공지 2 |
| 홈 · 관리자 | ① **처리할 일** — 마감 임박 투표(응답 n/전체, 미응답 n) · 팀 편성 필요 · 진행 중 경기, 각 행은 해당 화면으로 링크 ② 최근 공지 2. 없으면 "지금 처리할 일이 없어요" |
| 투표 | 제목 → `SegmentedControl`(진행 중/마감) → `ListCard`(종류 배지 · 제목 · 마감 · 내 응답 배지 · 응답 수). 관리자: 제목 줄 우측 "+ 투표" → `FormSheet` |
| 투표 상세 | 헤더(뒤로가기·제목) → 일시·장소·마감 → 응답 요약 → 명단(참석/불참/미응답 그룹). **모바일 하단 고정 참석/불참 버튼**(탭바 위) |
| 경기 | 제목 → `SegmentedControl`(예정·진행 중/지난 경기) → `ListCard`(날짜 · A vs B · 점수 · 상태 배지) |
| 경기 상세 | 헤더 → 점수판+타이머(스크롤 시 상단 고정) → 득점·교체 기록. **셸·레이아웃만 교체**, 타이머/운영 로직 통합은 Phase 3 |
| 출석 | 제목 → 대상 경기 선택 → 확정 인원 요약 → 체크 리스트(관리자만 체크 가능) |
| 더보기 | A-2 참조 |
| 멤버 (관리자) | 제목 + "+ 멤버" → 검색 입력 → `ListRow`(아바타 · 이름 · 역할 배지 · 계정 상태 배지: 가입됨/초대 대기/미초대) |
| 멤버 상세 | 헤더 → 프로필 → 스탯 → **계정** 섹션: 초대 코드 발급 또는 재설정 코드 발급(짝 문서 §2), 역할 변경(슈퍼관리자) |
| 내 정보 | 프로필 카드 → 이름 수정 → 비밀번호 변경 → 로그아웃. **전화번호 입력 제거**(D-03 백로그 Phase 1 항목 해소) |
| 공지 | `ListCard` 목록(고정 배지 · 제목 · 작성일), 탭하면 같은 화면에서 본문 펼침. 상세 라우트는 새로 만들지 않는다(현재도 없음). 관리자: "+ 공지" → `FormSheet` |
| 전략·전술보드 | 새 셸 적용만. 내부 UI는 D-01·D-04와 Phase 3에서 |
| 로그인·가입·재설정 | 셸 없는 인증 레이아웃: 흰 배경, 상단 로고, 입력과 주 버튼이 **iPhone 13 첫 화면 안**에 모두 들어온다. 로컬 모드에서만 하단에 데모 버튼 |

모든 목록 화면은 로딩(`CardSkeleton`) / 빈 상태(`EmptyState`, 권장 문구 포함) / 오류(`ErrorState`) 세 상태를 갖춘다.

## A-5. 검증

- **시각 회귀 e2e** `e2e/visual/shell.spec.ts`: iPhone 13 · 1024px · 1440px에서 주요 라우트 캡처(아티팩트 보관, 픽셀 비교는 하지 않음) + 자동 단언
  - 문서 가로 스크롤 없음(`scrollWidth <= clientWidth`)
  - 모바일: 목록 마지막 카드까지 스크롤했을 때 카드 하단이 탭바 상단보다 위에 있음
  - DEMO 칩이 페이지 제목·주 버튼과 겹치지 않음(bounding box 교차 검사)
  - 1024px에서 사이드바 내비게이션이 보임
- 라우트 스윕 e2e를 모바일 프로젝트에서도 실행(`playwright.config.ts`의 `testIgnore` 제거).
- 단계마다 모바일·데스크톱 캡처를 오너에게 보고한다.
- 기존 품질 게이트 유지: `pnpm lint && pnpm type-check && pnpm test && pnpm build && pnpm e2e`.

## A-6. 순서

1. 토큰 + 셸(모바일 탭바/헤더, 데스크톱 사이드바/상단바, DEMO 칩, 랜딩 제거) — 이것만으로 겹침 결함이 전 화면에서 사라진다
2. 공용 컴포넌트 + ESLint 금지 규칙
3. 자체 로그인(짝 문서) + 인증 화면
4. 홈 → 투표(목록·상세) → 경기(목록·상세 셸) → 출석
5. 더보기 → 멤버(목록·상세·코드 발급) → 내 정보 → 공지 → 전략(셸만) → 클럽 안내

각 단계는 독립 PR로 머지 가능해야 한다(중간 상태에서도 앱이 동작). 단계 1 직후에는 새 셸 안에 옛 페이지 본문이 들어간 혼합 상태가 되며, 이는 의도된 중간 상태다.

## 범위 밖
전술보드 기능(D-01), 팀 편성 서버 저장(D-04), 경기 운영 UI 통합, 투표 마감 액션, 다크 모드, PWA/설치형 앱, Supabase 재연결.
