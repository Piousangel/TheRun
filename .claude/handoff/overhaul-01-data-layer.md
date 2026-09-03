# 인계: TheRun Phase 0 — 포트/어댑터 데이터 계층 + 품질 인프라 (Supabase 없이 앱 띄우기)
- 갱신: 2026-09-03 / 브랜치: overhaul/01-data-layer / 커밋 상태: committed (마지막 커밋 e25b813은 **WIP, 미검증**)

## 멈춘 지점
`src/middleware.ts` (신규, 미검증) — Task 16(로컬 모드 미들웨어 + 데모 로그인 + 역할 전환기) 구현 중 사용자가 일시 중지를 요청함. 구현자는 "src/ 레이아웃에서는 루트 `middleware.ts`가 Next.js에 로드되지 않는다"는 걸 발견하고 `src/middleware.ts`로 옮기던 중이었고, vitest RED/GREEN·type-check·lint·build·curl 검증은 하나도 안 돌았다.

## 다음 단계 (순서대로)
1. `cat .superpowers/sdd/2026-09-03-phase0-data-layer-and-infra/progress.md` — SDD 원장. `Task 16:` 줄들의 PAUSED / FINDING / Ruling / RESUME를 읽는다. 이 원장이 진행 상태의 단일 원천이다.
2. `superpowers:subagent-driven-development` 스킬을 다시 띄우고(플랜: `docs/superpowers/plans/2026-09-03-phase0-data-layer-and-infra.md`), 원장에 따라 **Task 16을 새 구현자에게 재디스패치**한다. 브리프는 `.superpowers/sdd/.../task-16-brief.md`. 디스패치에 반드시 넣을 판정: 미들웨어는 `src/middleware.ts` 하나만 두고 루트 `middleware.ts`는 `git rm`; `middleware.test.ts`는 `src/middleware.test.ts`로 옮겨 `@/middleware`를 import(`// @vitest-environment node` 유지); WIP 커밋 e25b813의 내용을 검토 후 브리프 Step 4~9 재실행(Step 8 브라우저 확인은 curl로 대체 — 원장 참고). 완료 후 WIP 커밋은 `git reset --soft 9aa60c1` 후 정식 커밋 하나로 다시 만들 것.
3. Task 17(ESLint FSD 경계) → 18(Playwright) → 19(CI + Sentry) → 20(README·CLAUDE.md·supabase-reconnect.md). 브리프는 전부 `.superpowers/sdd/.../task-N-brief.md`에 이미 생성돼 있다.
4. 전체 브랜치 최종 리뷰(가장 강한 모델) → `superpowers:finishing-a-development-branch` → PR (`gh pr create --base main`, 본문 템플릿은 플랜 Task 20 Step 4).
5. PR 후 사용자에게 알릴 것: Vercel 환경변수에 `NEXT_PUBLIC_DATA_ADAPTER=local` 추가 필요.

## 완료 / 미완료
- [x] Task 1 pnpm 전환 + vitest (652967e) — test/type-check/lint/build 통과 확인
- [x] Task 2 포트 인터페이스 (f8e1cc9)
- [x] Task 3 CollectionStorage/MemoryStorage/Collection (c847381) — 5 tests
- [x] Task 4 IdbStorage/BrowserSessionStore (4ba3979) — 3 tests
- [x] Task 5 buildSeed(now) (aafe9b8) — 8 tests, UTC에서도 통과 확인
- [x] Task 6~10 리포 5개 + 계약 테스트 (c9e1e82, 946c150, c6e1280, 5f3d7bb, 96e312c)
- [x] Task 11 createCollectionApi + Supabase 어댑터 + client.ts getApi() (3cb82a8)
- [x] Task 12~14 entities 쿼리(member/match/announcement/vote/attendance/auth) + AuthProvider를 getApi()로 전환 (85d229f, 9b8f5a5, 071f5d4)
- [x] Task 15 위젯/피처 Supabase 직접 호출 제거, config/server를 adapters/supabase로 이동, storage.ts 삭제 (9aa60c1) — **이 시점에 lint/type-check/test 50/50 전부 green**
- [ ] Task 16 미들웨어 + 데모 로그인 + 역할 전환기 — WIP e25b813, 미검증
- [ ] Task 17 ESLint 규칙 + 상대 import 12곳·vote-card 경계 위반 정리
- [ ] Task 18 Playwright 스캐폴드 + 스모크
- [ ] Task 19 CI 워크플로 + Sentry 배선
- [ ] Task 20 README / CLAUDE.md / docs/supabase-reconnect.md (사용자가 "작업하면서 리드미도 바꿔줘" 요청함)
- [ ] 최종 브랜치 리뷰, PR

## 함정 · 결정사항
- **Supabase 프로젝트가 사라졌다**(`nfswocgetutexbrcvacd.supabase.co` DNS 불가). 사용자 결정: 당분간 Supabase 없이 로컬 어댑터로, 언젠가 재연결. `NEXT_PUBLIC_DATA_ADAPTER` 미설정 = local.
- **루트 `middleware.ts`는 src/ 레이아웃에서 로드되지 않는다** → 기존 프로덕션은 보호 라우트가 무방비였을 가능성이 큼. Phase 1 QA 결함 목록에 넣을 것. 미들웨어는 `src/middleware.ts`로.
- `.npmrc`에 `node-linker=hoisted` — pnpm 기본 심링크 레이아웃에서 `eslint-config-next`의 rushstack 패치가 크래시해서 넣은 것. 지우면 `pnpm lint`가 죽는다.
- `@vitejs/plugin-react`는 `^4.7.0`으로 고정 — 6.x는 ESM 전용이라 vitest2/vite5와 안 맞음.
- `src/shared/api/supabase/config.ts`의 클라이언트는 **지연 생성**(`getSupabaseClient()`) — env 없는 local 모드에서 import만으로 죽지 않게 하기 위함. `BrowserClient` 타입은 TS7006 회피용으로 `ReturnType<typeof createBrowserClient<any, 'public'>>`로 고정(eslint-disable 한 줄).
- 출석(attendance)은 별도 도메인이 아니라 `type: 'match'` 투표 위의 매핑(`src/entities/attendance/model/queries.ts`). Phase 3에서 위젯과 함께 삭제 예정.
- `useClaimableMembers`는 이제 `Member[]`만 반환 → `my-page-content.tsx`의 `isLegacyClaimFlow = false` 상수화(죽은 분기는 Phase 4에서 삭제).
- 테스트 헬퍼 `src/shared/lib/test/query-wrapper.tsx`가 어댑터를 직접 import하는 것은 **의도된 예외**(Task 17 ESLint에 예외 블록 있음).
- 리뷰에서 나온 사소 결함(deferred minor)과 판정(Ruling)은 전부 원장 `progress.md`에 있다. 최종 리뷰어에게 그 목록을 넘길 것.
- 커밋 메시지 트레일러 2줄(`Co-Authored-By: Claude Fable 5.1 …`, `Claude-Session: …session_01KmFjsGdekc4EvomPPHMzAq`) 필수.
- 스펙: `docs/superpowers/specs/2026-09-03-therun-overhaul-design.md` (사용자 승인 완료). 라우트 분리 `(app)`+`(mobile)/m`는 사용자가 추천을 뒤집고 선택한 것 — 다시 묻지 말 것.

## 검증 상태
- 9aa60c1(Task 15) 기준: lint 통과 / test 50/50 통과 / typecheck 통과 / build 통과(Task 1 이후 미재실행)
- e25b813(WIP) 기준: lint 미실행 / test 미실행 / typecheck 미실행 — **WIP은 깨져 있을 수 있음**
- 재현·확인 명령: `pnpm lint && pnpm type-check && pnpm test && pnpm build`
