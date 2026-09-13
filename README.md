# The Run — 풋살 클럽 운영

The Run 축구 동호회를 위한 모바일 중심 웹 앱. 투표 → 팀 나누기 → 경기 기록 → 공지의 주간 루프를 한 곳에서 돌린다.

> 지금은 **전면 개편 중**이다. 설계: `docs/superpowers/specs/2026-09-03-therun-overhaul-design.md`, 진행 계획: `docs/superpowers/plans/`. **오너가 승인된 스펙을 뒤집은 결정들은 `docs/product-decisions.md`에 있다 — 충돌 시 그 문서가 스펙을 이긴다.**

## 빠르게 실행하기

```bash
pnpm install
cp .env.local.example .env.local   # 기본값이 데모(local) 모드
pnpm dev                            # http://localhost:3000
```

로그인 화면의 **"멤버로 체험하기 / 관리자로 체험하기"**로 들어간다. 우상단 DEMO 바에서 계정을 바꾸거나(멤버·관리자·슈퍼관리자·미연결 계정) **데이터 초기화**로 시드를 되돌린다.

## 데이터 어댑터

| `NEXT_PUBLIC_DATA_ADAPTER` | 저장소 | 인증 | 용도 |
|---|---|---|---|
| `local` (기본) | 브라우저 IndexedDB + 시드(멤버 20·투표 3·경기 5·공지 4) | 데모 계정 4개 | 개발·데모·테스트. 기기별 저장, 멤버 간 공유 없음 |
| `supabase` | Supabase Postgres | Google OAuth | 실사용. 복귀가 확정됐다(`docs/product-decisions.md` D-06) — 절차는 `docs/supabase-reconnect.md` |

코드는 `src/shared/api/client.ts`의 `getApi()`만 호출한다. 어댑터는 `src/shared/api/adapters/{collection,supabase}`에 있고 같은 포트(`src/shared/api/ports`)를 구현한다.

## 명령어

```bash
pnpm dev          # 개발 서버
pnpm build        # 프로덕션 빌드
pnpm lint         # ESLint (FSD 경계·별칭 강제)
pnpm type-check   # tsc --noEmit
pnpm test         # vitest (유닛·훅·어댑터 계약)
pnpm e2e          # Playwright (setup → mobile: iPhone 13/webkit + desktop: Desktop Chrome)
```

CI(`.github/workflows/ci.yml`)가 PR마다 위 전부를 돌린다(e2e는 chromium과 webkit을 모두 설치한 뒤 실행).

## 기술 스택

Next.js 15 · React 19 · TypeScript · Tailwind + shadcn/ui · TanStack Query · Zustand · React Hook Form + Zod · idb-keyval · Supabase(복귀 확정) · vitest · Playwright · Sentry(선택, `NEXT_PUBLIC_SENTRY_DSN` 비우면 비활성)

## 구조 (FSD)

```
src/
├── app/        라우트
├── shared/     api(ports·adapters·client), ui, lib, types
├── entities/   도메인 쿼리 훅 (member, vote, match, announcement, auth) — attendance는 vote 위의 매핑
├── features/   사용자 액션 (폼, 버튼, dev-session)
├── widgets/    페이지 조합
└── providers/  QueryProvider, AuthProvider
```

## 배포

Vercel. 프로젝트 환경변수에 `NEXT_PUBLIC_DATA_ADAPTER=local`을 넣으면 백엔드 없이 데모로 배포된다.

## 라이선스

Private — The Run 풋살 클럽 전용
