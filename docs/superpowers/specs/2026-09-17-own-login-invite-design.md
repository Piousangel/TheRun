# 자체 로그인 + 초대 코드 가입 설계

- 작성: 2026-09-17 / 상태: 승인됨(브레인스토밍) → 구현 계획 대기
- 짝 문서: `2026-09-17-ui-overhaul-design.md` (로그인·가입·재설정 화면의 시각 규격은 그쪽 A-1을 따른다)
- 결정 기록: `docs/product-decisions.md` D-08

## 1. 목표와 범위

Google OAuth를 제거하고 **아이디 + 비밀번호** 로그인으로 바꾼다. 계정은 **관리자가 발급한 초대 코드로만** 만들 수 있고, 가입 순간 특정 멤버에 연결된다.

이 설계가 구조적으로 해소하는 재연결 차단 항목(`docs/supabase-reconnect.md` §0):
- **#1 가입 게이트** — 코드 없이는 계정이 생기지 않는다. "로그인 = 열람 권한"이 더 이상 누구에게나 열리지 않는다.
- **#3 멤버 연결 본인 확인** — 사용자가 멤버를 고르는 흐름 자체가 없어진다. 코드가 멤버를 지정한다.
- **#4 `get_claimable_members()`** — 호출처가 사라지므로 함수를 삭제한다.

범위 밖: 소셜 로그인 재도입, 이메일 수집, 로그인 시도 횟수 제한(아래 §6 근거), D-03 전화번호의 도메인 전체 제거(별도 항목).

## 2. 사용자 흐름

### 2.1 초대
1. 관리자가 멤버 상세에서 **초대 코드 만들기**를 누른다.
2. 코드가 생성된다. 형식 `RUN-XXXX-XXXX` (Crockford base32 8자, 혼동 문자 제외, 약 40비트).
   - 대상 멤버 1명에 귀속, **7일 만료, 1회용**
   - 같은 멤버·같은 용도의 미사용 코드가 있으면 새 코드 발급 시 기존 코드는 폐기된다
   - 이미 계정이 연결된 멤버에게는 초대 코드를 발급할 수 없다(재설정 코드만 가능)
3. 화면에 코드와 **복사** 버튼, 만료 시각이 보인다. 관리자가 단톡방/1:1로 전달한다.

### 2.2 가입 (`/signup`)
1. 코드 입력 → 유효하면 "**○○○** 님으로 가입합니다" 확인 표시. 무효/만료/사용됨은 한 가지 문구로 통일: "사용할 수 없는 코드예요. 운영진에게 새 코드를 요청하세요." (어떤 이유인지 구분해 알려주지 않는다)
2. 아이디, 비밀번호, 비밀번호 확인 입력 → **가입하기**
3. 성공 시 즉시 로그인 상태로 `/dashboard` 이동. 프로필은 `role='member'`, `member_id`=코드의 멤버.

### 2.3 로그인 (`/login`)
- 아이디, 비밀번호, **로그인** 버튼. 실패 문구는 하나: "아이디 또는 비밀번호가 맞지 않아요."
- 하단 링크: "초대 코드가 있어요 → 가입", "비밀번호를 잊었어요 → 운영진에게 재설정 코드를 요청한 뒤 재설정"
- 로컬 어댑터일 때만 그 아래 작은 "데모로 둘러보기" 영역(멤버/관리자/슈퍼관리자 버튼).

### 2.4 비밀번호 재설정 (`/reset`)
- 관리자가 멤버 상세에서 **비밀번호 재설정 코드**를 발급(초대와 같은 형식·만료·1회용, 용도만 `reset`). 계정이 연결된 멤버에게만 발급 가능.
- 사용자는 코드 + 새 비밀번호 입력 → 성공 시 로그인 화면으로 이동하며 "새 비밀번호로 로그인하세요" 토스트.
- 재설정 성공 시 해당 사용자의 기존 세션은 모두 무효화한다(Supabase: `auth.admin.signOut(userId, 'global')` 상당).

### 2.5 비밀번호 변경 (`/me`)
- 로그인 상태에서 현재 비밀번호 + 새 비밀번호.

### 2.6 첫 슈퍼관리자
- UI 흐름 없음. 일회성 스크립트 `scripts/create-superadmin.ts`(service role 키 사용)로 아이디·비밀번호·연결 멤버를 받아 생성. 로컬 어댑터는 기존처럼 시드가 슈퍼관리자 데모 계정을 가진다.

## 3. 규칙

| 항목 | 규칙 |
|---|---|
| 아이디 | `^[a-z0-9_]{4,20}$`. 입력은 소문자로 정규화. 전역 유일 |
| 비밀번호 | 8자 이상, 72바이트 이하(bcrypt 한계). 조합 규칙은 두지 않는다 |
| 코드 | 입력 시 대소문자·하이픈·공백 무시하고 정규화. DB에는 **SHA-256 해시만** 저장 |
| 코드 용도 | `invite` \| `reset` |
| 코드 상태 | 미사용 & 미만료 & 미폐기일 때만 유효 |

## 4. 아키텍처

### 4.1 아이디 → 이메일 매핑 (Supabase 모드)
Supabase Auth는 이메일/비밀번호를 쓰므로 아이디를 **합성 이메일** `{username}@users.therun.invalid`로 저장한다. `.invalid`는 RFC 2606 예약 TLD로 메일이 절대 배달되지 않는다. 사용자에게는 이메일이 어디에도 노출되지 않는다. 매핑 함수는 `src/shared/lib/auth/username.ts` 한 곳에만 둔다.

Supabase 프로젝트 설정: **Email provider의 Allow new users to sign up = OFF**, Confirm email = OFF, Google provider 비활성. 가입은 service role로만 일어난다.

### 4.2 가입/재설정은 서버 라우트에서만
브라우저가 `supabase.auth.signUp`을 부르면 코드 검증을 우회할 수 있으므로, 쓰기 흐름은 Next.js Route Handler가 수행한다.

- `POST /api/auth/invite/preview` `{ code }` → `{ memberName } | 404`
- `POST /api/auth/signup` `{ code, username, password }`
- `POST /api/auth/reset` `{ code, newPassword }`

`signup` 순서(부분 실패 시 되돌림 포함):
1. 입력 검증(zod, 공용 스키마 `src/shared/lib/auth/schemas.ts`)
2. 코드 **선점**: `update invite_codes set used_at=now() where code_hash=$1 and purpose='invite' and used_at is null and revoked_at is null and expires_at>now() returning member_id` — 0행이면 400(통일 문구)
3. 아이디 중복 확인 → 중복이면 코드 선점 되돌림(`used_at=null`) 후 409 "이미 쓰는 아이디예요"
4. `auth.admin.createUser({ email: 합성, password, email_confirm: true })` → 실패 시 선점 되돌림
5. `app_profiles` insert(`user_id`, `username`, `member_id`, `role='member'`) → 실패 시 4에서 만든 사용자 삭제 + 선점 되돌림
6. `invite_codes.used_by = user_id` 기록
7. 서버에서 `signInWithPassword`로 세션 쿠키 설정(`@supabase/ssr` 서버 클라이언트) 후 200

`SUPABASE_SERVICE_ROLE_KEY`는 **서버 전용 환경변수**다(`NEXT_PUBLIC_` 금지). service role 클라이언트는 `src/shared/api/adapters/supabase/server-admin.ts`에만 두고, ESLint `no-restricted-imports`로 `src/app/api/**` 밖에서의 import를 막는다.

### 4.3 포트 변경 (`src/shared/api/ports/auth-repo.ts`)

삭제:
- `signInWithOAuth`
- `linkMyMember`, `unlinkMyMember`, `listClaimableMembers`
- `DemoAccountKey`의 `'unlinked'` (미연결 계정이라는 상태가 없어진다)

추가:
```ts
signInWithPassword(input: { username: string; password: string }): Promise<AuthUser>;
previewInvite(code: string): Promise<{ memberName: string } | null>;
signUpWithInvite(input: { code: string; username: string; password: string }): Promise<AuthUser>;
resetPasswordWithCode(input: { code: string; newPassword: string }): Promise<void>;
changePassword(input: { currentPassword: string; newPassword: string }): Promise<void>;
/** admin 이상. 같은 멤버·용도의 미사용 코드는 폐기된다. 평문 코드는 이 반환값에서만 볼 수 있다 */
issueCode(input: { memberId: string; purpose: 'invite' | 'reset' }): Promise<{ code: string; expiresAt: string }>;
/** admin 이상. 멤버별 계정 상태 */
listAccountStatuses(): Promise<Array<{ memberId: string; status: 'active' | 'invited' | 'none'; username: string | null }>>;
```
유지: `getUser`, `onAuthStateChange`, `signInAsDemo`(로컬 전용), `signOut`, `ensureProfile`, `listProfiles`, `setProfileRole`, `updateMyMemberProfile`(입력에서 `phoneNumber` 제거 — `/me` 입력칸 제거와 함께).

`AuthUser`에 `username: string | null`을 추가한다(`email`은 합성값이므로 UI에서 쓰지 않는다; 필드는 호환을 위해 유지하되 표시 금지).

### 4.4 어댑터
- **supabase**: `signInWithPassword`는 브라우저 클라이언트로 직접(합성 이메일 변환). `previewInvite`/`signUpWithInvite`/`resetPasswordWithCode`는 위 라우트를 `fetch`. `issueCode`/`listAccountStatuses`는 RLS로 admin만 허용된 테이블/RPC 조회. `changePassword`는 현재 비번으로 재인증 후 `auth.updateUser`.
- **collection(로컬/메모리)**: 같은 규칙을 IndexedDB 컬렉션으로 구현. 비밀번호는 WebCrypto PBKDF2(SHA-256, 10만 회, 16바이트 솔트)로 해시해 저장(데모지만 평문 저장 습관을 남기지 않는다). 세션은 기존 쿠키 `therun-session` 방식 유지. 시드에 데모 계정 3종의 아이디(`member`, `admin`, `superadmin`)와 비밀번호(`demo1234`)를 넣는다.

### 4.5 DB (신규 마이그레이션 `supabase/migrations/20260917_own_login_invites.sql`)
```sql
alter table app_profiles add column username text unique
  check (username ~ '^[a-z0-9_]{4,20}$');

create table invite_codes (
  id uuid primary key default uuid_generate_v4(),
  code_hash text not null unique,
  purpose text not null check (purpose in ('invite','reset')),
  member_id uuid not null references members(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references auth.users(id),
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now()
);
alter table invite_codes enable row level security;
-- admin/superadmin만 select/insert/update. 익명·일반 멤버 접근 없음.
-- preview/signup/reset은 service role(서버 라우트)만 사용하므로 anon 정책을 두지 않는다.
```
함께 삭제: `get_claimable_members()`, 멤버 연결/해제 RPC, OAuth 전제의 프로필 자동 생성 트리거가 있다면 해당 트리거.

## 5. 삭제 목록 (코드)
- `src/app/auth/callback`, `src/app/auth/confirm`
- `src/shared/ui/provider-logo.tsx`, `src/shared/ui/auth-shell.tsx`(A 설계의 새 인증 레이아웃으로 대체)
- 로그인 위젯의 Google 버튼·설명 카드, `/me`의 멤버 연결/해제 UI와 `isLegacyClaimFlow`
- 미들웨어의 `/auth/*` 예외 → `/login`, `/signup`, `/reset`, `/api/auth/*`를 공개 경로로

## 6. 보안 판단
- **코드 추측 공격**: 40비트 공간, 동시에 유효한 코드는 최대 수십 개, 7일 만료 → 온라인 추측으로 맞출 확률은 무시 가능. 요청 횟수 제한은 이번 범위에서 두지 않는다. 재검토 조건: 멤버가 수백 명 단위로 늘거나, Vercel 로그에서 preview 엔드포인트 반복 호출이 관측될 때.
- **아이디 존재 여부 노출**: 로그인 실패 문구는 단일. 가입 시 "이미 쓰는 아이디"는 유효한 코드를 가진 사람에게만 보이므로 허용.
- **service role 키 노출**: 서버 전용 모듈 + ESLint 차단 + 빌드 산출물에 키 문자열이 없는지 CI에서 grep 검사.

## 7. 테스트
공유 계약 테스트(`src/shared/api/adapters/contracts/auth-repo.contract.ts`)에 추가:
- 코드 없이/무효 코드로 가입 → 실패
- 만료·사용됨·폐기된 코드 → 실패, 실패 사유는 구분되지 않음
- 아이디 형식 위반·중복 → 실패, **실패 시 코드가 소진되지 않음**
- 가입 성공 → 해당 멤버에 연결된 `role='member'` 프로필, 코드 재사용 불가
- 재발급 시 이전 코드 폐기
- 연결된 멤버에게 invite 발급 불가 / 미연결 멤버에게 reset 발급 불가
- 멤버 권한으로 `issueCode`·`listAccountStatuses` → 실패 (§0 #6 "권한 축" 첫 적용)
- 재설정 후 이전 비밀번호로 로그인 실패, 새 비밀번호로 성공

단위: 아이디 정규화/합성 이메일 변환, 코드 생성·정규화·해시.
e2e: 관리자 코드 발급 → 로그아웃 → 가입 → 홈 진입(로컬 어댑터).

Supabase 어댑터는 프로젝트가 아직 스키마 미적용이므로 이번 구현에서는 **타입체크·빌드·라우트 핸들러 단위 테스트(모킹)**까지 검증하고, 실제 계약 테스트 실행은 재연결 작업에서 한다. 이 점을 `docs/supabase-reconnect.md` §2에 명시한다.
