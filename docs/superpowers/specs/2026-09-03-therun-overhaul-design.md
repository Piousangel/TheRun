# The Run 전면 개편 설계 (2026-09-03)

> 상태: 설계 승인 완료 (브레인스토밍 §1~§6 각 섹션 승인). 다음 단계는 `writing-plans`로 구현 계획 작성.

## 1. 배경과 현황

- 제품: The Run 풋살 동호회 운영 앱. Next.js 15 + React 19 + Tailwind + shadcn/ui + TanStack Query + Zustand, FSD 구조. 138 파일 / 약 17.6k LOC / 라우트 19개. 마지막 푸시 2026-03-16.
- 정적 검사(tsc · lint · build)는 전부 통과한다. "정상 동작 안 함"은 런타임/동작 레벨 문제다.
- **백엔드가 없다.** `.env.local.example`의 Supabase 호스트 `nfswocgetutexbrcvacd.supabase.co`는 DNS 조회가 되지 않는다(프로젝트 삭제 추정). 당분간 Supabase 없이 가고, 나중에 다시 연결한다(비용 사유).
- 디자인 세대가 두 개 공존한다: `AppChrome` 기반 워크스페이스 셸과 옛 page-first 화면. `LAUNCH_BLOCKERS.md`에 기록돼 있다.
- 거대 위젯: `match-detail-widget.tsx` 1176줄, `app-dashboard-content.tsx` 990줄.
- 테스트 0개, 에러 모니터링 없음, CI 없음.
- 셸에 기능 없는 장식 문구("Ready for Saturday flow", "Launch Readiness", "Club OS / Weekly ops / Runner mark" 뱃지, 모바일 탭바 위 브랜드 띠)가 많다.
- Supabase 결합도: 직접 호출 파일 16개. 데이터 접근은 `entities/*/model/queries.ts` 6개(약 44개 호출)에 집중, RPC 5개(`link_my_member`, `unlink_my_member`, `get_claimable_members`, `set_app_profile_role`, `update_my_member_profile`), 스토리지 1파일, auth 6호출. features/widgets 5곳에 직접 호출이 새어 있다(member-create-form, member-edit-form, my-page-content, login-page-content, match-schedule 카드).
- `/team-division`은 `/strategy`로 리다이렉트만 하고, 팀나누기는 전술보드 안에 관리자 전용으로 묻혀 있다.
- `attendance_sessions/attendance_votes`와 `vote_sessions/vote_responses`는 같은 개념이 두 번 있는 것이다.

참고 대상: `~/Desktop/Code/car-rental-backoffice` (이하 "백오피스"). 화면 구조 패턴 · 디자인 언어 · 코드 구조/컨벤션 · 품질 인프라를 가져온다. 브랜드 컬러(골드/블랙)는 유지한다.

## 2. 목표 (완료 기준)

1. **핵심 루프 완주**: 투표 생성 → 멤버 응답 → 마감 → 참석자로 팀나누기 → 경기 기록(점수·골·MVP·타이머) → 종료가 402px 모바일에서 끊김 없이 된다.
2. **화면 전부 새 셸·프리미티브로 통일**: 레거시 위젯 0개, 300줄 넘는 위젯 0개.
3. **장식 문구·AI slop 제거**, 로딩/빈/에러 상태 100% 공용 컴포넌트, 골드/블랙 브랜드 유지.
4. **데이터 계층 교체 가능**: `NEXT_PUBLIC_DATA_ADAPTER=local|supabase` 하나로 전환.
5. **유닛테스트 + 핵심 루프 E2E 스모크 green이 PR 게이트.**

성공의 정의: 클럽 멤버들이 매주 실제로 쓴다. 단, 백엔드 연결 전까지는 기기별 저장(데모) 상태임을 인지한다.

## 3. 비목표

- Supabase 대체 백엔드 구축(Neon/Turso + 자체 API/Auth). Supabase 복귀를 전제한다.
- 다크 모드. 현 `globals.css`의 다크 토큰은 삭제한다.
- 푸시 알림, PWA 설치 배너. Supabase 복귀 이후 검토.
- 기능 삭제. 투표·출석·팀나누기·경기 기록·공지·회원 관리·전술보드·랜딩·클럽가이드 모두 유지한다.

## 4. 결정 사항

### §1 데이터 계층 — 포트/어댑터

```
src/shared/api/
├── ports/                     # 인터페이스만. 도메인당 하나
│   ├── member-repo.ts         # list / get / create / update / remove / uploadPhoto
│   ├── vote-repo.ts           # session CRUD + response upsert + close   (출석 흡수)
│   ├── match-repo.ts          # CRUD + start / finish (타이머 타임스탬프 포함)
│   ├── announcement-repo.ts   # CRUD + markRead / reads
│   ├── auth-repo.ts           # session, profile, signIn/Out, link/unlink, claimable, setRole, updateMyMember
│   └── index.ts               # ClubApi = { members, votes, matches, announcements, auth }
├── adapters/
│   ├── collection/            # 공용 구현: KeyValueStorage 위에 리포 5개 전부 구현
│   │   ├── storage.ts         #   KeyValueStorage 포트 (get / set / del / list)
│   │   ├── memory-storage.ts  #   Map 기반 → 테스트용
│   │   ├── idb-storage.ts     #   IndexedDB(idb-keyval) 기반 → 브라우저용
│   │   ├── seed.ts            #   멤버 20 · 투표 3회차 · 경기 5 · 공지 4 · 프로필 3역할
│   │   └── *-repo.ts
│   └── supabase/              # 현 queries.ts의 supabase 호출을 그대로 옮김. 비활성
└── client.ts                  # NEXT_PUBLIC_DATA_ADAPTER = local | supabase 로 선택
```

- 로컬 어댑터와 테스트 어댑터는 같은 코드다. 리포 로직은 `collection/`에 한 번만 쓰고 저장소만 Map ↔ IndexedDB로 바꾼다.
- `entities/*/model/queries.ts`는 유지한다. `supabase.from(...)` 자리를 `api.<domain>.<method>()`로 바꾸고, 쿼리 키 팩토리·훅 시그니처는 유지한다. features/widgets에 새어 나온 직접 호출 5곳은 entities로 끌어올린다.
- 인증은 목 세션 + 역할 전환기. local 모드에서 화면 하단 개발 바(멤버A / 관리자 / 슈퍼관리자 / 로그아웃 / 데이터 초기화). 미들웨어는 local 모드일 때 `therun-session` 쿠키로 보호 라우트를 판정한다. Google/이메일 로그인 UI는 남기되 local에서는 "데모 계정으로 들어가기"로 연결한다.
- 프로필 사진은 IndexedDB에 blob으로 저장한다.
- **출석을 투표 도메인에 흡수한다.** 출석 = `type: 'match'` 투표. `/attendance` 화면은 "이번 주 경기 투표" 뷰가 된다. `attendance` 엔티티는 Phase 6에서 삭제한다.
- RPC 5개의 검증 규칙(전화번호 일치, 중복 연결 금지, 역할 변경 권한)은 로컬 어댑터에서 TS로 동일하게 구현한다.
- Supabase 복귀: `adapters/supabase`가 같은 포트를 구현하므로 env 하나로 전환한다. `attendance_*` 테이블은 마이그레이션 한 번으로 `vote_*`에 합친다.

### §2 라우트 & 셸

```
src/app/
├── (public)/                      셸 없음: /  /club-guide  /login(AuthShell)
├── auth/callback · auth/confirm   route handler 유지
├── (mobile)/m/                    MobileShell — 완전체(멤버 + 관리자 전부)
│   home · votes · votes/[id] · matches · matches/[id] · team · notices · notices/[id]
│   · members · members/[id] · strategy · more · more/profile · [...slug]→/m/home
└── (app)/                         AppShell(사이드바 + 탑바) — 관리자 워크스페이스 8개
    dashboard · votes · matches · team · members · notices · strategy · me
```

- 모바일 탭바 5개: **홈 · 투표 · 경기 · 공지 · 더보기**. 멤버/팀나누기/전술/역할관리는 더보기 런처 타일.
- 핵심 루프는 CTA 체인으로 잇는다: 투표 상세 "참석자 N명으로 팀 나누기" → 팀 화면 "이 팀으로 경기 만들기" → 경기 기록.
- 화면 본체 공유: `features/*/ui/`(공용) + `features/*/ui/mobile/`(모바일 전용 조합). `(app)`/`(mobile)`의 page.tsx는 조립만 한다. 공유: 폼 전부, 스탯 차트, 카드, 전술보드 캔버스, 타이머. 분기: 목록 레이아웃(테이블 ↔ 카드), 상세(페이지 ↔ 시트), 내비게이션.
- 셸 규칙(백오피스 MobileShell 이식): 루트 `h-dvh` + `overflow-hidden`, `main`만 스크롤, 탭바 56px + safe-area 여백. 최상위 탭 화면은 헤더를 그리지 않는다(홈만 브랜드 + 인사). 깊은 화면은 `useMobileHeaderStore`로 제목 + 뒤로가기 오버라이드.
- 기기 라우팅: 미들웨어가 모바일 UA의 `(app)` 진입을 대응 `/m/...`로 리다이렉트. 데스크톱 UA의 `/m/...` 진입은 허용. 수동 전환(더보기 "데스크톱으로 보기" / 탑바 "모바일로 보기")은 `therun-view` 쿠키로, UA 판정보다 우선.
- 구 URL 리다이렉트(`next.config`, 영구): `/attendance→/votes`, `/announcements→/notices`, `/team-division→/team`, `/dashboard`는 UA에 따라 `/m/home` 또는 유지.
- 권한: 라우트 접근은 미들웨어(로그인 여부)만. 화면 내 관리자 액션은 `useAuth().isAdmin`으로 숨긴다. 멤버가 관리자 URL에 직접 진입하면 `StatePanel`("관리자 권한이 필요합니다")로 소프트 차단.

### §3 디자인 시스템

토큰: 백오피스처럼 `--bg / --fg / --fg-muted / --border / --signal-* / --skeleton-*` 의미 토큰을 원본으로 두고 shadcn HSL 변수를 파생시킨다. 라이트 전용.

| 역할 | 값 | 용도 |
|---|---|---|
| `--brand-gold` | `#C8A858` | 버튼 · 활성 탭 · 강조 1개소 |
| `--brand-gold-bright` | `#FFD700` | 브랜드 마크 · MVP 뱃지만 |
| `--ink` | `#0A0A0A` | 헤드라인 · 보조 버튼 |
| 중립 | stone 5단계 | 배경 / 카드 / 테두리 / 보조 텍스트 |
| `--signal-green/red/amber/purple` fg+bg | 백오피스 값 | 참석 / 불참 / 마감임박 / MVP · 긴급공지 |
| 폰트 | Pretendard Variable | |
| 레이아웃 | `--tabbar-h 56px` `--topbar-h 52px` `--sidebar-w 232px`, 콘텐츠 패딩 16/24px | |

프리미티브(`src/shared/ui/`):
- 이식: `StatusBadge` · `StatTile`(기존 정리) · `StatePanel`(기존) · `AlertBanner` · `ConfirmDialog` · `FormSheet`(모바일 바텀시트 ↔ 데스크톱 다이얼로그 자동 분기) · `CountTabs` · `Skeleton` + `skeletons/{card,list,detail}` · `HistoryList/Row` · `DatePicker` · `FieldLabel/Description` · `ClampedText` · `ErrorBoundary` · `SkipNav`
- TheRun 전용: `MemberAvatar` · `StatRadar` · `PlayerChip` · `VoteChoice`(참석/불참 토글, 44px+) · `Countdown` · `ScoreBoard` · `TeamColumn`

절대 규칙(ESLint 강제):
- 로딩 = 공용 Skeleton만. `animate-pulse` 직접 마크업 금지, "로딩 중" 텍스트 금지.
- 빈 상태 = `StatePanel`, 다음 행동 CTA 필수.
- 변경 성공/실패 = sonner 토스트. 파괴 액션 = `ConfirmDialog`.
- 폼 컨트롤 높이 48px, `rounded-xl`, 라벨은 `FieldLabel`.
- 앱 화면에서 motion 금지(시트 전환 제외). `RevealSection`은 랜딩에서만.

삭제: 영문 eyebrow 라벨, "Club OS / Weekly ops / Runner mark" 뱃지, `editorial-*` · `glass-panel` 유틸리티, 임의 반경(`rounded-[1.35rem]`류), 골드 그라데이션 글로우 박스, 다크 토큰.

### §4 화면 목록 & 재작성 순서

Phase 3 — 핵심 루프(모바일 먼저):

| # | 화면 | 내용 |
|---|---|---|
| 1 | `/m/home` | 이번 주 경기 카드(투표 상태 · 내 응답 · 마감 카운트다운 · CTA), 최신 공지 2, 다음/최근 경기, 관리자 할 일(마감 임박 · 팀 미구성 · 미기록 경기). 설명 카드 삭제 |
| 2 | `/m/votes` | 진행 중/지난 `CountTabs`, 카드(제목 · 일시 · 카운트다운 · 참석 n / 불참 n · 내 응답 뱃지), 관리자 FAB → `FormSheet` |
| 3 | `/m/votes/[id]` | `VoteChoice`, 참석/불참/미응답 탭 + 멤버 리스트, 관리자 마감/재오픈/삭제, CTA "참석자 N명으로 팀 나누기" |
| 4 | `/m/team` | 대상 투표 선택(기본 = 최근 마감 경기 투표) → 자동 밸런스(`TeamColumn`×2 + 스탯 비교) → 수동 조정(칩 탭 → 이동; DnD는 데스크톱만) → CTA "이 팀으로 경기 만들기". persist 유지 |
| 5 | `/m/matches` | 예정/진행/종료 탭, `ScoreBoard` 미니 카드 |
| 6 | `/m/matches/[id]` | `ScoreBoard` + sticky 타이머, 골/교체 기록 시트, `HistoryList` 타임라인, MVP 선택, 종료. 피처 분해: `match-timer` `match-goal` `match-substitution` `match-mvp` `match-timeline` |

Phase 4 — 운영:

| # | 화면 | 내용 |
|---|---|---|
| 7-9 | `/m/notices`, `[id]`, 작성 시트 | 고정 / 카테고리 / 읽음 표시, 관리자 작성 · 수정 · 삭제 |
| 10-11 | `/m/members`, `[id]` | 검색 · 스탯 합계 정렬. 상세 = `StatRadar` + 최근 기록 + 관리자 편집/삭제/역할 |
| 12 | `/m/more` | 런처 타일: 내 계정 · 멤버 · 팀나누기 · 전술보드 · 역할 관리(superadmin) · 클럽 가이드 · 데스크톱으로 보기 · 로그아웃 |
| 13 | `/m/more/profile` | 계정↔멤버 연결(전화번호 검증), 내 정보 수정, 로그아웃 |

Phase 5 — 부가: 14 `/m/strategy`(팀 A/B 탭, 6v6/7v7/8v8, 포지션 메뉴; 현 로직 유지) · 15 `/` 랜딩 · 16 `/club-guide` · 17 `/login`

데스크톱 8개는 각 Phase 끝에 조립: dashboard(할 일 넓게) · votes(테이블 + 우측 상세 패널) · matches · team(DnD) · members(테이블 + 역할관리 탭) · notices · strategy(와이드) · me

화면 done 조건(4개 전부): (a) Phase 1 QA 결함 목록의 해당 항목 전부 해소 (b) 로딩/빈/에러 3상태 공용 컴포넌트 (c) 402px + 데스크톱 스크린샷 확인 (d) 옮긴 즉시 레거시 위젯 삭제.

### §5 품질 인프라

| 층 | 내용 |
|---|---|
| 유닛 (vitest + jsdom + RTL) | 컬렉션 리포 5개(계정 연결 규칙 포함) · `autoBalanceTeams` · 투표 마감/집계 · 타이머 복원 · 시드 무결성 · 프리미티브(`VoteChoice` `Countdown` `StatusBadge` `StatePanel`). `*.test.tsx` 옆자리 배치 |
| E2E (Playwright) | DB 하네스 불필요. setup 프로젝트가 역할 쿠키로 member/admin storageState 생성. 스펙: 핵심 루프 1개, 공지 읽음, 계정 연결. 프로젝트: iPhone 402폭 + Desktop Chrome |
| ESLint (flat) | `no-restricted-syntax`(animate-pulse · "로딩 중"), FSD 경계 `no-restricted-imports`, `@/` 별칭 강제 |
| CI (GitHub Actions) | PR → lint · type-check · vitest · build · playwright(chromium). Node 22 + pnpm. Vercel Preview는 `NEXT_PUBLIC_DATA_ADAPTER=local` |
| 게이트 (CLAUDE.md) | 화면 done 4조건, `grep animate-pulse` 0건 |
| Sentry | `@sentry/nextjs` 배선, DSN 없으면 no-op |

### §6 진행 순서 · 브랜치 · 문서

- 브랜치: `main`에서 `overhaul/<phase>-<topic>` 분기, 단계별 PR. Phase 0 이후 `main`은 항상 배포 가능.
- Phase 0 데이터 계층 + 인프라 스캐폴드 → Phase 1 QA 리포트 `docs/qa/<date>-baseline-defects.md`(화면 × 역할 × 결함, 재현 · 심각도) → Phase 2 새 셸 · 프리미티브(새 라우트 그룹에 세우고 구 라우트는 유지) → Phase 3~5 화면 PR마다 "신규 화면 + 구 URL 리다이렉트 + 레거시 삭제" → Phase 6 `attendance` 엔티티 · `editorial-*` · 구 셸 제거, README / CLAUDE.md / DESIGN_SYSTEM.md 재작성, `LAUNCH_BLOCKERS` `PROJECT_PROGRESS` `MIGRATION_GUIDE` `PRODUCT_REFINEMENT_LOOP` 삭제, `docs/HANDOFF.md` 신설.
- Supabase 복귀 문서 `docs/supabase-reconnect.md`: 적용할 마이그레이션(출석→투표 병합 포함), env 전환, RPC 정합성 테스트 체크리스트.

## 5. 단계 요약

| 단계 | 내용 | 산출물 |
|---|---|---|
| 0 | 포트/어댑터 + 로컬 어댑터 + 시드 + 역할 전환기 + vitest/playwright/eslint/CI 스캐폴드 | 앱이 Supabase 없이 뜸, CI green |
| 1 | 전수 QA (시드 데이터, 3역할 × 전 화면) | 결함 목록 = 화면 재작성 인수 체크리스트 |
| 2 | 새 셸 + 프리미티브 세트 | 디자인 언어 확정 |
| 3 | 핵심 루프: 홈 → 투표 → 팀나누기 → 경기 (+데스크톱 4) | 매주 쓰는 흐름 완성, 핵심 루프 E2E green |
| 4 | 운영: 공지 → 멤버 → 더보기/내 계정 (+데스크톱 3) | 관리자 흐름 완성 |
| 5 | 부가: 전술보드 → 랜딩/클럽가이드/로그인 (+데스크톱 1) | 전 화면 통일 |
| 6 | 레거시 삭제 · 문서 갱신 · Supabase 복귀 문서 | 마무리 |

## 6. 리스크

- 기기별 저장이라 멤버 간 데이터 공유가 안 된다. Supabase 복귀 전까지 "데모"임을 로그인 화면에 명시한다.
- 로컬 어댑터와 Supabase 어댑터의 동작 차이(RLS · RPC). 포트 계약 테스트를 두 어댑터가 공유하게 작성해 복귀 시 같은 테스트로 검증한다. Docker 로컬 Supabase(`supabase start`)는 복귀 직전 검증용으로 쓸 수 있다.
- 라우트 분리로 화면 수가 늘어난다. 화면 본체 공유 규칙(§2)을 지키지 않으면 유지비가 두 배가 된다. 리뷰에서 `(app)`/`(mobile)` page.tsx가 조립 이상을 하면 반려한다.
- Google OAuth · 이메일 OTP는 local 모드에서 동작하지 않는다. `adapters/supabase` 유지로 복귀 시 그대로 살린다.
