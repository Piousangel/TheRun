# Phase 0 — 데이터 계층(포트/어댑터) + 품질 인프라 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase 없이 앱이 뜨고(IndexedDB 로컬 어댑터 + 시드 + 역할 전환기), env 하나로 Supabase 어댑터로 돌아갈 수 있으며, vitest/Playwright/ESLint/CI가 PR 게이트로 동작한다.

**Architecture:** `src/shared/api/ports/*`에 도메인별 리포 인터페이스를 두고, `adapters/collection/`이 `CollectionStorage`(Map ↔ IndexedDB) 위에 리포 5개를 한 번만 구현한다. `adapters/supabase/`는 현재 `entities/*/model/queries.ts` 안의 Supabase 호출을 같은 포트로 옮긴 것이다. `entities/*/model/queries.ts`의 훅 이름·쿼리 키·반환 타입은 유지하고 내부만 `getApi()` 호출로 바꾼다. 위젯/피처는 손대지 않는다(직접 supabase를 부르는 5곳 제외).

**Tech Stack:** Next.js 15.5 · React 19 · TypeScript 5.7 · TanStack Query 5 · pnpm 9 · vitest 2 + jsdom + @testing-library/react · fake-indexeddb · idb-keyval · Playwright · @sentry/nextjs · date-fns 4

**Spec:** `docs/superpowers/specs/2026-09-03-therun-overhaul-design.md` (§1 데이터 계층, §5 품질 인프라, §6 진행 순서)

## Global Constraints

- 패키지 매니저는 **pnpm**. `package-lock.json`은 삭제하고 `pnpm-lock.yaml`만 커밋한다.
- import는 항상 `@/*` 별칭. 상대 경로 import 금지 (ESLint로 강제).
- FSD 방향: `shared` → `entities` → `features` → `widgets` → `app`. 상향 import 금지 (ESLint로 강제). 예외: `@/providers`는 Phase 2 셸 교체 전까지 어디서든 허용.
- `@/shared/api/adapters/**`와 `@/shared/api/supabase/**`는 `src/shared/api/**` 밖에서 import 금지. 밖에서는 `@/shared/api/client`의 `getApi()`만 쓴다.
- 데이터 어댑터 선택: `NEXT_PUBLIC_DATA_ADAPTER=local | supabase`. 미설정 시 `local`.
- 로컬 세션 쿠키 이름: `therun-session` (값 = 데모 사용자 id). 로컬 세션 localStorage 키: `therun:session`.
- IndexedDB 키 접두사: `therun:` (예: `therun:members`).
- 로딩 텍스트("로딩 중", "불러오는 중")와 `animate-pulse` 직접 마크업은 ESLint **warn** (Phase 2에서 공용 Skeleton 도입 후 error로 승격).
- 모든 커밋 메시지 끝에 아래 두 줄을 붙인다:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01KmFjsGdekc4EvomPPHMzAq
  ```
- 작업 브랜치: `overhaul/00-design-spec`에서 이어서 `overhaul/01-data-layer` 생성 후 작업. (`git checkout -b overhaul/01-data-layer`)
- 기존 화면·위젯의 동작을 바꾸지 않는다. Phase 0의 목적은 "같은 화면이 Supabase 없이 뜬다"이다.

---

## 파일 구조

```
src/shared/api/
├── ports/
│   ├── member-repo.ts          MemberRepo
│   ├── vote-repo.ts            VoteRepo, VoteResponseWithMember, RespondInput
│   ├── match-repo.ts           MatchRepo
│   ├── announcement-repo.ts    AnnouncementRepo
│   ├── auth-repo.ts            AuthRepo, AuthUser, DemoAccountKey, DEMO_ACCOUNTS
│   └── index.ts                ClubApi
├── adapters/
│   ├── collection/
│   │   ├── storage.ts          CollectionStorage 포트 + SessionStore 포트 + NotFoundError
│   │   ├── memory-storage.ts   MemoryStorage, MemorySessionStore
│   │   ├── idb-storage.ts      IdbStorage (idb-keyval), BrowserSessionStore (localStorage + cookie)
│   │   ├── collection.ts       Collection<T> (all/get/insert/update/remove)
│   │   ├── seed.ts             buildSeed(now) — 결정적 시드
│   │   ├── member-repo.ts      createCollectionMemberRepo
│   │   ├── vote-repo.ts        createCollectionVoteRepo
│   │   ├── match-repo.ts       createCollectionMatchRepo
│   │   ├── announcement-repo.ts
│   │   ├── auth-repo.ts        createCollectionAuthRepo (규칙: link/unlink/claimable/setRole/updateMyMember)
│   │   └── create-api.ts       createCollectionApi({ storage, session, now })
│   ├── contracts/              어댑터 공용 계약 테스트 (supabase 어댑터도 나중에 같은 걸 돌린다)
│   │   ├── member-repo.contract.ts
│   │   ├── vote-repo.contract.ts
│   │   ├── match-repo.contract.ts
│   │   ├── announcement-repo.contract.ts
│   │   └── auth-repo.contract.ts
│   └── supabase/
│       ├── config.ts           (이동) createBrowserClient
│       ├── server.ts           (이동) createSupabaseServerClient
│       └── create-api.ts       createSupabaseApi() — 현 queries.ts의 호출을 포트로 옮김
└── client.ts                   getDataAdapter / isLocalAdapter / getApi / resetLocalData

src/entities/*/model/queries.ts   내부만 getApi()로 교체. attendance는 votes 위의 매핑으로 재구현
src/providers/auth-provider.tsx   AuthUser 기반으로 교체
src/features/dev-session/ui/dev-role-switcher.tsx   로컬 모드 역할 전환기
src/middleware.ts (루트 middleware.ts)             로컬 모드 세션 쿠키 판정
e2e/                              Playwright (setup + smoke)
.github/workflows/ci.yml
vitest.config.ts · vitest.setup.ts · playwright.config.ts · eslint.config.mjs
```

---

### Task 1: pnpm 전환 + vitest 스캐폴드

**Files:**
- Delete: `package-lock.json`
- Modify: `package.json` (scripts, packageManager, devDependencies)
- Create: `vitest.config.ts`, `vitest.setup.ts`, `src/shared/lib/utils.test.ts`
- Modify: `.gitignore` (playwright 산출물), `tsconfig.json` (vitest globals 타입)

**Interfaces:**
- Produces: `pnpm test`, `pnpm test:watch`, `pnpm type-check`, `pnpm lint` 스크립트. 이후 모든 Task는 이 스크립트를 쓴다.

- [ ] **Step 1: 브랜치 생성 및 pnpm 전환**

```bash
git checkout -b overhaul/01-data-layer
rm package-lock.json
pnpm import 2>/dev/null || true   # lock이 없으면 그냥 install
pnpm install
```

`package.json`에 추가/수정:

```json
{
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "db:apply-masked-phone-migration": "tsx scripts/apply-masked-phone-migration.ts supabase/migrations/20260312_mask_member_numbers_and_enable_self_member_updates.sql",
    "db:promote-social-admins": "tsx scripts/apply-masked-phone-migration.ts supabase/migrations/20260313_promote_all_social_users_to_admin.sql"
  }
}
```

```bash
pnpm add -D vitest@^2 @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event fake-indexeddb
pnpm add idb-keyval
```

- [ ] **Step 2: vitest 설정 파일 작성**

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    exclude: ['node_modules/**', 'e2e/**', '.next/**'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

`vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
```

`tsconfig.json`의 `compilerOptions`에 `"types": ["node", "vitest/globals", "@testing-library/jest-dom"]` 추가. `include`에 `"vitest.setup.ts"` 추가.

`.gitignore` 끝에 추가:

```
# playwright
/test-results
/playwright-report
/e2e/.auth
```

- [ ] **Step 3: 스모크 테스트 작성**

`src/shared/lib/utils.test.ts`:

```ts
import { normalizePhoneNumber, getMemberPhoneDisplay, MASKED_MEMBER_PHONE_NUMBER } from '@/shared/lib/utils';

describe('normalizePhoneNumber', () => {
  it('11자리 숫자를 010-0000-0000 형식으로 만든다', () => {
    expect(normalizePhoneNumber('01012345678')).toBe('010-1234-5678');
    expect(normalizePhoneNumber(' 010 1234 5678 ')).toBe('010-1234-5678');
  });

  it('11자리가 아니면 trim만 한다', () => {
    expect(normalizePhoneNumber(' 1234 ')).toBe('1234');
  });
});

describe('getMemberPhoneDisplay', () => {
  it('마스킹 번호는 비공개로 표시한다', () => {
    expect(getMemberPhoneDisplay(MASKED_MEMBER_PHONE_NUMBER)).toBe('연락처 비공개');
    expect(getMemberPhoneDisplay('010-1234-5678')).toBe('010-1234-5678');
  });
});
```

- [ ] **Step 4: 테스트·타입체크·린트·빌드 실행**

Run: `pnpm test`
Expected: `1 passed` 파일, 3 tests passed

Run: `pnpm type-check && pnpm lint && pnpm build`
Expected: 모두 exit 0. (`eslint .`가 `.next/`를 스캔하지 않도록 `eslint.config.mjs`의 `ignores`에 이미 `.next/**`가 있다.)

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "chore: switch to pnpm and add vitest scaffold"
```

---

### Task 2: 포트 인터페이스 정의

**Files:**
- Create: `src/shared/api/ports/member-repo.ts`, `vote-repo.ts`, `match-repo.ts`, `announcement-repo.ts`, `auth-repo.ts`, `index.ts`

**Interfaces:**
- Produces: 아래 타입 전부. 이후 Task는 이 시그니처를 그대로 구현/사용한다.

- [ ] **Step 1: 포트 파일 작성**

`src/shared/api/ports/member-repo.ts`:

```ts
import type { CreateMemberData, Member, UpdateMemberData } from '@/shared/types/member';

export interface MemberRepo {
  /** created_at 내림차순 */
  list(): Promise<Member[]>;
  get(id: string): Promise<Member | null>;
  create(data: CreateMemberData): Promise<Member>;
  update(id: string, data: UpdateMemberData): Promise<Member>;
  remove(id: string): Promise<void>;
  /** 업로드 후 접근 가능한 URL(로컬 어댑터는 data URL)을 돌려준다 */
  uploadPhoto(file: File, memberId: string): Promise<string>;
}
```

`src/shared/api/ports/vote-repo.ts`:

```ts
import type { Member } from '@/shared/types/member';
import type {
  CreateVoteSessionData,
  UpdateVoteSessionData,
  VoteResponse,
  VoteSession,
} from '@/shared/types/vote';

export type VoteResponseWithMember = VoteResponse & { members: Member | null };

export interface RespondInput {
  sessionId: string;
  memberId: string;
  status: 'attending' | 'absent';
}

export interface VoteRepo {
  /** event_date 내림차순 */
  listSessions(): Promise<VoteSession[]>;
  /** is_active = true, event_date 오름차순 */
  listActiveSessions(): Promise<VoteSession[]>;
  getSession(id: string): Promise<VoteSession | null>;
  createSession(data: CreateVoteSessionData): Promise<VoteSession>;
  updateSession(id: string, data: UpdateVoteSessionData): Promise<VoteSession>;
  removeSession(id: string): Promise<void>;
  listResponses(sessionId: string): Promise<VoteResponseWithMember[]>;
  /** (session_id, member_id) 기준 upsert */
  respond(input: RespondInput): Promise<VoteResponse>;
}
```

`src/shared/api/ports/match-repo.ts`:

```ts
import type { CreateMatchData, Match, UpdateMatchData } from '@/shared/types/match';

export interface MatchRepo {
  /** date 내림차순 */
  list(): Promise<Match[]>;
  get(id: string): Promise<Match | null>;
  create(data: CreateMatchData): Promise<Match>;
  update(id: string, data: UpdateMatchData): Promise<Match>;
  remove(id: string): Promise<void>;
}
```

`src/shared/api/ports/announcement-repo.ts`:

```ts
import type {
  Announcement,
  AnnouncementRead,
  CreateAnnouncementData,
  UpdateAnnouncementData,
} from '@/shared/types/announcement';

export interface AnnouncementRepo {
  /** is_pinned 내림차순, publish_at 내림차순 */
  list(): Promise<Announcement[]>;
  get(id: string): Promise<Announcement | null>;
  /** created_by = 현재 로그인 사용자 id */
  create(data: CreateAnnouncementData): Promise<Announcement>;
  update(id: string, data: UpdateAnnouncementData): Promise<Announcement>;
  remove(id: string): Promise<void>;
  listReads(userId: string): Promise<AnnouncementRead[]>;
  /** (announcement_id, user_id) 기준 upsert */
  markRead(announcementId: string, userId: string): Promise<AnnouncementRead>;
}
```

`src/shared/api/ports/auth-repo.ts`:

```ts
import type { AppProfile } from '@/shared/types/auth';
import type { Member } from '@/shared/types/member';

export interface AuthUser {
  id: string;
  email: string | null;
}

export type DemoAccountKey = 'member' | 'admin' | 'superadmin' | 'unlinked';

export const DEMO_ACCOUNTS: Record<DemoAccountKey, { id: string; email: string; label: string }> = {
  member: { id: 'u-member', email: 'member@therun.demo', label: '멤버' },
  admin: { id: 'u-admin', email: 'admin@therun.demo', label: '관리자' },
  superadmin: { id: 'u-superadmin', email: 'superadmin@therun.demo', label: '슈퍼관리자' },
  unlinked: { id: 'u-unlinked', email: 'newbie@therun.demo', label: '미연결 계정' },
};

export interface AuthRepo {
  getUser(): Promise<AuthUser | null>;
  /** 반환값은 unsubscribe */
  onAuthStateChange(listener: (user: AuthUser | null) => void): () => void;
  /** OAuth 리다이렉트 URL을 돌려준다. 로컬 어댑터는 url: null */
  signInWithOAuth(provider: 'google', redirectTo: string): Promise<{ url: string | null }>;
  /** 로컬 어댑터 전용. supabase 어댑터는 Error를 던진다 */
  signInAsDemo(account: DemoAccountKey): Promise<AuthUser>;
  signOut(): Promise<void>;
  /** 프로필이 없으면 role='member', member_id=null로 만든다 */
  ensureProfile(user: AuthUser): Promise<AppProfile>;
  /** role 내림차순, email 오름차순 */
  listProfiles(): Promise<AppProfile[]>;
  /** superadmin만. 자기 자신·superadmin 대상 불가 */
  setProfileRole(targetProfileId: string, role: 'member' | 'admin'): Promise<AppProfile>;
  /** 이미 다른 멤버와 연결돼 있거나, 대상이 다른 계정에 연결돼 있으면 Error */
  linkMyMember(memberId: string): Promise<AppProfile>;
  unlinkMyMember(): Promise<AppProfile>;
  /** 아무 계정에도 연결되지 않았거나 나에게 연결된 멤버. name 오름차순 */
  listClaimableMembers(): Promise<Member[]>;
  /** 내 연결 멤버의 이름/전화번호 수정. 전화번호는 (010|000)-0000-0000 형식 */
  updateMyMemberProfile(input: { name: string; phoneNumber: string }): Promise<Member>;
}
```

`src/shared/api/ports/index.ts`:

```ts
import type { AnnouncementRepo } from '@/shared/api/ports/announcement-repo';
import type { AuthRepo } from '@/shared/api/ports/auth-repo';
import type { MatchRepo } from '@/shared/api/ports/match-repo';
import type { MemberRepo } from '@/shared/api/ports/member-repo';
import type { VoteRepo } from '@/shared/api/ports/vote-repo';

export interface ClubApi {
  members: MemberRepo;
  votes: VoteRepo;
  matches: MatchRepo;
  announcements: AnnouncementRepo;
  auth: AuthRepo;
}

export type { AnnouncementRepo, AuthRepo, MatchRepo, MemberRepo, VoteRepo };
export type { AuthUser, DemoAccountKey } from '@/shared/api/ports/auth-repo';
export { DEMO_ACCOUNTS } from '@/shared/api/ports/auth-repo';
export type { RespondInput, VoteResponseWithMember } from '@/shared/api/ports/vote-repo';
```

- [ ] **Step 2: 타입체크**

Run: `pnpm type-check`
Expected: exit 0

- [ ] **Step 3: 커밋**

```bash
git add src/shared/api/ports
git commit -m "feat(api): define repository ports for members, votes, matches, announcements, auth"
```

---

### Task 3: CollectionStorage 포트 + MemoryStorage + Collection 헬퍼

**Files:**
- Create: `src/shared/api/adapters/collection/storage.ts`, `memory-storage.ts`, `collection.ts`
- Test: `src/shared/api/adapters/collection/collection.test.ts`

**Interfaces:**
- Produces: `CollectionStorage`, `SessionStore`, `NotFoundError`, `MemoryStorage`, `MemorySessionStore`, `Collection<T>`.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/shared/api/adapters/collection/collection.test.ts`:

```ts
import { Collection } from '@/shared/api/adapters/collection/collection';
import { MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import { NotFoundError } from '@/shared/api/adapters/collection/storage';

interface Row { id: string; name: string; }

function makeCollection(seed: Row[] = []) {
  const storage = new MemoryStorage();
  return { storage, col: new Collection<Row>(storage, 'rows', () => seed) };
}

describe('Collection', () => {
  it('첫 읽기에 시드를 저장한다', async () => {
    const { storage, col } = makeCollection([{ id: 'a', name: 'A' }]);
    expect(await col.all()).toEqual([{ id: 'a', name: 'A' }]);
    expect(await storage.read<Row>('rows')).toEqual([{ id: 'a', name: 'A' }]);
  });

  it('빈 배열도 시드로 저장해 다시 시드하지 않는다', async () => {
    let calls = 0;
    const storage = new MemoryStorage();
    const col = new Collection<Row>(storage, 'rows', () => { calls += 1; return []; });
    await col.all();
    await col.all();
    expect(calls).toBe(1);
  });

  it('insert / get / update / remove', async () => {
    const { col } = makeCollection();
    await col.insert({ id: 'a', name: 'A' });
    expect(await col.get('a')).toEqual({ id: 'a', name: 'A' });
    expect(await col.update('a', { name: 'B' })).toEqual({ id: 'a', name: 'B' });
    await col.remove('a');
    expect(await col.get('a')).toBeNull();
  });

  it('없는 id를 update하면 NotFoundError', async () => {
    const { col } = makeCollection();
    await expect(col.update('x', { name: 'B' })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('replaceAll은 전체를 덮어쓴다', async () => {
    const { col } = makeCollection([{ id: 'a', name: 'A' }]);
    await col.replaceAll([{ id: 'z', name: 'Z' }]);
    expect(await col.all()).toEqual([{ id: 'z', name: 'Z' }]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test collection.test`
Expected: FAIL — `Cannot find module '@/shared/api/adapters/collection/collection'`

- [ ] **Step 3: 구현**

`src/shared/api/adapters/collection/storage.ts`:

```ts
/** 컬렉션 하나를 통째로 읽고 쓰는 저장소. 데이터가 작아(멤버 수십, 투표 수십) 배열 단위로 다룬다. */
export interface CollectionStorage {
  read<T>(collection: string): Promise<T[] | undefined>;
  write<T>(collection: string, rows: T[]): Promise<void>;
  clear(): Promise<void>;
}

/** 로컬 인증 세션(로그인한 데모 사용자 id) 저장소. 미들웨어도 읽어야 하므로 브라우저 구현은 쿠키도 쓴다. */
export interface SessionStore {
  get(): string | null;
  set(userId: string): void;
  clear(): void;
}

export class NotFoundError extends Error {
  constructor(collection: string, id: string) {
    super(`${collection}에서 ${id}를 찾을 수 없습니다.`);
    this.name = 'NotFoundError';
  }
}
```

`src/shared/api/adapters/collection/memory-storage.ts`:

```ts
import type { CollectionStorage, SessionStore } from '@/shared/api/adapters/collection/storage';

export class MemoryStorage implements CollectionStorage {
  private data = new Map<string, unknown[]>();

  async read<T>(collection: string): Promise<T[] | undefined> {
    const rows = this.data.get(collection);
    return rows ? (structuredClone(rows) as T[]) : undefined;
  }

  async write<T>(collection: string, rows: T[]): Promise<void> {
    this.data.set(collection, structuredClone(rows));
  }

  async clear(): Promise<void> {
    this.data.clear();
  }
}

export class MemorySessionStore implements SessionStore {
  private userId: string | null = null;

  get() { return this.userId; }
  set(userId: string) { this.userId = userId; }
  clear() { this.userId = null; }
}
```

`src/shared/api/adapters/collection/collection.ts`:

```ts
import { NotFoundError, type CollectionStorage } from '@/shared/api/adapters/collection/storage';

/** id를 가진 행들의 컬렉션. 첫 읽기 때 seed()로 초기화한다(빈 배열이어도 저장해서 재시드 방지). */
export class Collection<T extends { id: string }> {
  constructor(
    private readonly storage: CollectionStorage,
    private readonly name: string,
    private readonly seed: () => T[],
  ) {}

  async all(): Promise<T[]> {
    const rows = await this.storage.read<T>(this.name);
    if (rows) return rows;
    const seeded = this.seed();
    await this.storage.write(this.name, seeded);
    return seeded;
  }

  async get(id: string): Promise<T | null> {
    return (await this.all()).find((row) => row.id === id) ?? null;
  }

  async insert(row: T): Promise<T> {
    const rows = await this.all();
    await this.storage.write(this.name, [...rows, row]);
    return row;
  }

  async update(id: string, patch: Partial<T>): Promise<T> {
    const rows = await this.all();
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) throw new NotFoundError(this.name, id);
    const next = { ...rows[index], ...patch };
    rows[index] = next;
    await this.storage.write(this.name, rows);
    return next;
  }

  async remove(id: string): Promise<void> {
    const rows = await this.all();
    await this.storage.write(this.name, rows.filter((row) => row.id !== id));
  }

  async replaceAll(rows: T[]): Promise<void> {
    await this.storage.write(this.name, rows);
  }
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm test collection.test`
Expected: 5 passed

- [ ] **Step 5: 커밋**

```bash
git add src/shared/api/adapters/collection
git commit -m "feat(api): add collection storage port, memory storage and Collection helper"
```

---

### Task 4: IdbStorage + BrowserSessionStore

**Files:**
- Create: `src/shared/api/adapters/collection/idb-storage.ts`
- Test: `src/shared/api/adapters/collection/idb-storage.test.ts`

**Interfaces:**
- Consumes: `CollectionStorage`, `SessionStore` (Task 3)
- Produces: `IdbStorage`, `BrowserSessionStore`, 상수 `SESSION_COOKIE = 'therun-session'`, `SESSION_STORAGE_KEY = 'therun:session'`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/shared/api/adapters/collection/idb-storage.test.ts`:

```ts
import { BrowserSessionStore, IdbStorage, SESSION_COOKIE, SESSION_STORAGE_KEY } from '@/shared/api/adapters/collection/idb-storage';

describe('IdbStorage', () => {
  it('write 후 read, clear 후 undefined', async () => {
    const storage = new IdbStorage();
    expect(await storage.read('members')).toBeUndefined();
    await storage.write('members', [{ id: 'a' }]);
    expect(await storage.read('members')).toEqual([{ id: 'a' }]);
    await storage.clear();
    expect(await storage.read('members')).toBeUndefined();
  });
});

describe('BrowserSessionStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.cookie = `${SESSION_COOKIE}=; max-age=0; path=/`;
  });

  it('set은 localStorage와 쿠키에 같이 쓴다', () => {
    const store = new BrowserSessionStore();
    store.set('u-admin');
    expect(store.get()).toBe('u-admin');
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBe('u-admin');
    expect(document.cookie).toContain(`${SESSION_COOKIE}=u-admin`);
  });

  it('clear는 둘 다 지운다', () => {
    const store = new BrowserSessionStore();
    store.set('u-admin');
    store.clear();
    expect(store.get()).toBeNull();
    expect(document.cookie).not.toContain('u-admin');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test idb-storage.test`
Expected: FAIL — module not found

- [ ] **Step 3: 구현**

`src/shared/api/adapters/collection/idb-storage.ts`:

```ts
import { clear, createStore, del, get, keys, set } from 'idb-keyval';
import type { CollectionStorage, SessionStore } from '@/shared/api/adapters/collection/storage';

const KEY_PREFIX = 'therun:';
export const SESSION_COOKIE = 'therun-session';
export const SESSION_STORAGE_KEY = 'therun:session';

export class IdbStorage implements CollectionStorage {
  private readonly store = createStore('therun', 'collections');

  async read<T>(collection: string): Promise<T[] | undefined> {
    return get<T[]>(KEY_PREFIX + collection, this.store);
  }

  async write<T>(collection: string, rows: T[]): Promise<void> {
    await set(KEY_PREFIX + collection, rows, this.store);
  }

  async clear(): Promise<void> {
    const allKeys = await keys(this.store);
    await Promise.all(allKeys.map((key) => del(key, this.store)));
    await clear(this.store);
  }
}

/** localStorage(클라이언트 판정) + 쿠키(미들웨어 판정)에 같은 값을 쓴다. */
export class BrowserSessionStore implements SessionStore {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(SESSION_STORAGE_KEY);
  }

  set(userId: string): void {
    window.localStorage.setItem(SESSION_STORAGE_KEY, userId);
    document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(userId)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  }

  clear(): void {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm test idb-storage.test`
Expected: 3 passed (`fake-indexeddb/auto`가 vitest.setup.ts에서 로드됨)

- [ ] **Step 5: 커밋**

```bash
git add src/shared/api/adapters/collection/idb-storage.ts src/shared/api/adapters/collection/idb-storage.test.ts
git commit -m "feat(api): add IndexedDB storage and browser session store"
```

---

### Task 5: 결정적 시드 `buildSeed(now)`

**Files:**
- Create: `src/shared/api/adapters/collection/seed.ts`
- Test: `src/shared/api/adapters/collection/seed.test.ts`

**Interfaces:**
- Consumes: `DEMO_ACCOUNTS` (Task 2), 도메인 타입 (`@/shared/types/*`)
- Produces:
  ```ts
  export interface SeedData {
    users: AuthUser[]; profiles: AppProfile[]; members: Member[];
    voteSessions: VoteSession[]; voteResponses: VoteResponse[];
    matches: Match[]; announcements: Announcement[]; announcementReads: AnnouncementRead[];
  }
  export function buildSeed(now: Date): SeedData
  ```
  고정 id 규칙: 멤버 `m-01`…`m-20`, 투표 `vs-this-week`(진행 중 경기), `vs-dining`(진행 중 회식), `vs-last-week`(마감된 경기), 경기 `mt-1`…`mt-5`, 공지 `an-1`…`an-4`.
  데모 사용자: `u-member`→`m-01`(member), `u-admin`→`m-02`(admin), `u-superadmin`→`m-03`(superadmin), `u-unlinked`→null(member).

- [ ] **Step 1: 실패하는 테스트 작성**

`src/shared/api/adapters/collection/seed.test.ts`:

```ts
import { buildSeed } from '@/shared/api/adapters/collection/seed';

const NOW = new Date('2026-09-03T10:00:00+09:00'); // 목요일

describe('buildSeed', () => {
  const seed = buildSeed(NOW);

  it('멤버 20명, 전화번호는 010-0000-0000 형식, 스탯은 0~100', () => {
    expect(seed.members).toHaveLength(20);
    for (const member of seed.members) {
      expect(member.phone_number).toMatch(/^010-\d{4}-\d{4}$/);
      for (const value of Object.values(member.stats)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it('데모 사용자 4명과 프로필 역할/연결이 맞는다', () => {
    const byId = Object.fromEntries(seed.profiles.map((p) => [p.id, p]));
    expect(byId['u-member']).toMatchObject({ role: 'member', member_id: 'm-01' });
    expect(byId['u-admin']).toMatchObject({ role: 'admin', member_id: 'm-02' });
    expect(byId['u-superadmin']).toMatchObject({ role: 'superadmin', member_id: 'm-03' });
    expect(byId['u-unlinked']).toMatchObject({ role: 'member', member_id: null });
    expect(seed.users.map((u) => u.id).sort()).toEqual(['u-admin', 'u-member', 'u-superadmin', 'u-unlinked']);
  });

  it('이번 주 경기 투표는 다가오는 토요일, 마감은 그 전 금요일 23:59, 진행 중', () => {
    const thisWeek = seed.voteSessions.find((s) => s.id === 'vs-this-week')!;
    expect(thisWeek.type).toBe('match');
    expect(thisWeek.is_active).toBe(true);
    const eventDate = new Date(thisWeek.event_date);
    const deadline = new Date(thisWeek.deadline);
    expect(eventDate.getDay()).toBe(6);
    expect(eventDate.getTime()).toBeGreaterThan(NOW.getTime());
    expect(deadline.getTime()).toBeLessThan(eventDate.getTime());
    expect(deadline.getTime()).toBeGreaterThan(NOW.getTime());
  });

  it('지난 주 경기 투표는 마감·비활성이고 응답이 있다', () => {
    const lastWeek = seed.voteSessions.find((s) => s.id === 'vs-last-week')!;
    expect(lastWeek.is_active).toBe(false);
    expect(new Date(lastWeek.event_date).getTime()).toBeLessThan(NOW.getTime());
    const responses = seed.voteResponses.filter((r) => r.session_id === 'vs-last-week');
    expect(responses.length).toBeGreaterThanOrEqual(12);
  });

  it('응답은 (session_id, member_id)가 유일하고 존재하는 멤버를 가리킨다', () => {
    const memberIds = new Set(seed.members.map((m) => m.id));
    const keys = new Set<string>();
    for (const r of seed.voteResponses) {
      expect(memberIds.has(r.member_id)).toBe(true);
      const key = `${r.session_id}:${r.member_id}`;
      expect(keys.has(key)).toBe(false);
      keys.add(key);
    }
  });

  it('경기 5개는 모두 finished이고 양 팀 member_ids가 겹치지 않는다', () => {
    expect(seed.matches).toHaveLength(5);
    for (const match of seed.matches) {
      expect(match.status).toBe('finished');
      const a = new Set(match.team_a.member_ids);
      for (const id of match.team_b.member_ids) expect(a.has(id)).toBe(false);
      expect(match.team_a.players.map((p) => p.member_id)).toEqual(match.team_a.member_ids);
    }
  });

  it('공지 4개 중 1개는 고정, 읽음은 비어 있다', () => {
    expect(seed.announcements).toHaveLength(4);
    expect(seed.announcements.filter((a) => a.is_pinned)).toHaveLength(1);
    expect(seed.announcementReads).toEqual([]);
  });

  it('같은 now로 두 번 만들면 동일하다', () => {
    expect(buildSeed(NOW)).toEqual(seed);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test seed.test`
Expected: FAIL — module not found

- [ ] **Step 3: 구현**

`src/shared/api/adapters/collection/seed.ts`:

```ts
import { addDays, nextSaturday, previousSaturday, set, subDays, subWeeks } from 'date-fns';
import { DEMO_ACCOUNTS, type AuthUser } from '@/shared/api/ports/auth-repo';
import type { Announcement, AnnouncementRead } from '@/shared/types/announcement';
import type { AppProfile } from '@/shared/types/auth';
import type { GoalRecord, Match, PlayerMatchRecord, TeamMatchData } from '@/shared/types/match';
import type { Member, MemberStats } from '@/shared/types/member';
import type { VoteResponse, VoteSession } from '@/shared/types/vote';

export interface SeedData {
  users: AuthUser[];
  profiles: AppProfile[];
  members: Member[];
  voteSessions: VoteSession[];
  voteResponses: VoteResponse[];
  matches: Match[];
  announcements: Announcement[];
  announcementReads: AnnouncementRead[];
}

const MEMBER_NAMES = [
  '김민준', '이서준', '박도윤', '최예준', '정시우', '강하준', '조주원', '윤지호', '장지후', '임준서',
  '한건우', '오현우', '서우진', '신선우', '권서진', '황연우', '안민재', '송현준', '류은우', '홍유준',
];

/** 이름 인덱스로 결정되는 가짜 스탯. 골키퍼형/공격형/수비형이 섞이도록 패턴을 돌린다. */
function statsFor(index: number): MemberStats {
  const base = 45 + ((index * 7) % 30); // 45~74
  const swing = (index % 5) * 6;        // 0~24
  return {
    speed: Math.min(100, base + ((index % 3 === 0) ? swing : 0)),
    shooting: Math.min(100, base + ((index % 3 === 1) ? swing : 0)),
    passing: Math.min(100, base + ((index % 4 === 0) ? swing : 5)),
    dribbling: Math.min(100, base + ((index % 3 === 2) ? swing : 0)),
    stamina: Math.min(100, base + 10 - (index % 4) * 3),
    defense: Math.min(100, base + ((index % 5 === 4) ? swing : 0)),
  };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function iso(date: Date) {
  return date.toISOString();
}

function atTime(date: Date, hours: number, minutes: number) {
  return set(date, { hours, minutes, seconds: 0, milliseconds: 0 });
}

function team(name: string, memberIds: string[], goals: GoalRecord[], goalkeeperId: string): TeamMatchData {
  const players: PlayerMatchRecord[] = memberIds.map((memberId) => ({
    member_id: memberId,
    goals: goals.filter((g) => g.scorer_id === memberId).length,
    assists: goals.filter((g) => g.assist_id === memberId).length,
    saves: memberId === goalkeeperId ? 3 : 0,
    is_mvp: false,
  }));
  return {
    name,
    member_ids: memberIds,
    score: goals.length,
    players,
    goalkeeper_id: goalkeeperId,
    manager_id: null,
    substitutions: [],
    goals_detail: goals,
  };
}

export function buildSeed(now: Date): SeedData {
  const createdAt = iso(subWeeks(now, 12));
  const thisSaturday = atTime(nextSaturday(now), 7, 0);
  const lastSaturday = atTime(previousSaturday(now), 7, 0);

  const members: Member[] = MEMBER_NAMES.map((name, index) => ({
    id: `m-${pad(index + 1)}`,
    name,
    phone_number: `010-${pad(10 + index)}00-${pad(index + 1)}${pad(index + 1)}`,
    profile_photo: null,
    stats: statsFor(index),
    created_at: iso(addDays(subWeeks(now, 12), index)),
    updated_at: iso(addDays(subWeeks(now, 12), index)),
  }));

  const users: AuthUser[] = (Object.keys(DEMO_ACCOUNTS) as Array<keyof typeof DEMO_ACCOUNTS>).map((key) => ({
    id: DEMO_ACCOUNTS[key].id,
    email: DEMO_ACCOUNTS[key].email,
  }));

  const profiles: AppProfile[] = [
    { id: 'u-member', email: DEMO_ACCOUNTS.member.email, role: 'member', member_id: 'm-01', created_at: createdAt, updated_at: createdAt },
    { id: 'u-admin', email: DEMO_ACCOUNTS.admin.email, role: 'admin', member_id: 'm-02', created_at: createdAt, updated_at: createdAt },
    { id: 'u-superadmin', email: DEMO_ACCOUNTS.superadmin.email, role: 'superadmin', member_id: 'm-03', created_at: createdAt, updated_at: createdAt },
    { id: 'u-unlinked', email: DEMO_ACCOUNTS.unlinked.email, role: 'member', member_id: null, created_at: createdAt, updated_at: createdAt },
  ];

  const voteSessions: VoteSession[] = [
    {
      id: 'vs-this-week',
      title: `${thisSaturday.getMonth() + 1}월 ${thisSaturday.getDate()}일 정기 경기`,
      description: '오전 7시 킥오프. 6시 50분까지 도착해주세요.',
      type: 'match',
      event_date: iso(thisSaturday),
      deadline: iso(atTime(subDays(thisSaturday, 1), 23, 59)),
      is_active: true,
      created_at: iso(subDays(thisSaturday, 6)),
      updated_at: iso(subDays(thisSaturday, 6)),
    },
    {
      id: 'vs-dining',
      title: '경기 후 회식',
      description: '경기 끝나고 근처 국밥집. 참석 인원 파악용입니다.',
      type: 'dining',
      event_date: iso(atTime(thisSaturday, 9, 30)),
      deadline: iso(atTime(subDays(thisSaturday, 1), 23, 59)),
      is_active: true,
      created_at: iso(subDays(thisSaturday, 5)),
      updated_at: iso(subDays(thisSaturday, 5)),
    },
    {
      id: 'vs-last-week',
      title: `${lastSaturday.getMonth() + 1}월 ${lastSaturday.getDate()}일 정기 경기`,
      description: null,
      type: 'match',
      event_date: iso(lastSaturday),
      deadline: iso(atTime(subDays(lastSaturday, 1), 23, 59)),
      is_active: false,
      created_at: iso(subDays(lastSaturday, 6)),
      updated_at: iso(subDays(lastSaturday, 1)),
    },
  ];

  const respond = (sessionId: string, memberIndexes: number[], status: 'attending' | 'absent', at: Date): VoteResponse[] =>
    memberIndexes.map((index) => ({
      id: `vr-${sessionId}-${pad(index)}`,
      session_id: sessionId,
      member_id: `m-${pad(index)}`,
      status,
      created_at: iso(at),
      updated_at: iso(at),
    }));

  const voteResponses: VoteResponse[] = [
    ...respond('vs-last-week', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 'attending', subDays(lastSaturday, 3)),
    ...respond('vs-last-week', [15, 16, 17], 'absent', subDays(lastSaturday, 3)),
    ...respond('vs-this-week', [2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 'attending', subDays(thisSaturday, 4)),
    ...respond('vs-this-week', [12, 13], 'absent', subDays(thisSaturday, 4)),
    ...respond('vs-dining', [2, 3, 4, 5, 6], 'attending', subDays(thisSaturday, 4)),
  ];

  const teamA = ['m-01', 'm-03', 'm-05', 'm-07', 'm-09', 'm-11', 'm-13'];
  const teamB = ['m-02', 'm-04', 'm-06', 'm-08', 'm-10', 'm-12', 'm-14'];
  const matches: Match[] = [0, 1, 2, 3, 4].map((weekOffset) => {
    const date = atTime(subWeeks(lastSaturday, weekOffset), 7, 0);
    const goalsA: GoalRecord[] = [
      { minute: 12 + weekOffset, scorer_id: 'm-05', assist_id: 'm-03', timestamp: iso(date) },
      { minute: 33, scorer_id: 'm-07', assist_id: null, timestamp: iso(date) },
    ];
    const goalsB: GoalRecord[] = weekOffset % 2 === 0
      ? [{ minute: 20, scorer_id: 'm-04', assist_id: 'm-06', timestamp: iso(date) }]
      : [
          { minute: 8, scorer_id: 'm-04', assist_id: null, timestamp: iso(date) },
          { minute: 25, scorer_id: 'm-08', assist_id: 'm-10', timestamp: iso(date) },
          { minute: 41, scorer_id: 'm-04', assist_id: 'm-06', timestamp: iso(date) },
        ];
    const a = team('Team A', teamA, goalsA, 'm-13');
    const b = team('Team B', teamB, goalsB, 'm-14');
    a.players[2].is_mvp = weekOffset % 2 === 0; // m-05
    b.players[1].is_mvp = weekOffset % 2 === 1; // m-04
    return {
      id: `mt-${weekOffset + 1}`,
      date: iso(date),
      location: '더런 풋살장',
      team_a: a,
      team_b: b,
      notes: weekOffset === 0 ? '전반 비가 와서 10분 늦게 시작' : null,
      vote_session_id: weekOffset === 0 ? 'vs-last-week' : null,
      match_number: 1,
      status: 'finished',
      start_time: iso(date),
      end_time: iso(atTime(date, 8, 0)),
      duration: 50 * 60,
      created_at: iso(date),
      updated_at: iso(atTime(date, 8, 0)),
    };
  });

  const announcements: Announcement[] = [
    { id: 'an-1', title: '9월 회비 안내', body: '이번 달 회비는 9월 10일까지 입금 부탁드립니다.', category: 'general', is_pinned: true, publish_at: iso(subDays(now, 2)), created_by: 'u-admin', created_at: iso(subDays(now, 2)), updated_at: iso(subDays(now, 2)) },
    { id: 'an-2', title: '이번 주 경기장 변경', body: '이번 주는 A구장 대신 B구장에서 진행합니다.', category: 'match', is_pinned: false, publish_at: iso(subDays(now, 1)), created_by: 'u-admin', created_at: iso(subDays(now, 1)), updated_at: iso(subDays(now, 1)) },
    { id: 'an-3', title: '10월 첫째 주 휴식', body: '추석 연휴로 10월 첫째 주 경기는 쉽니다.', category: 'schedule', is_pinned: false, publish_at: iso(subDays(now, 5)), created_by: 'u-superadmin', created_at: iso(subDays(now, 5)), updated_at: iso(subDays(now, 5)) },
    { id: 'an-4', title: '분실물: 검정 정강이 보호대', body: '지난 경기 후 벤치에 남겨진 보호대를 보관 중입니다.', category: 'urgent', is_pinned: false, publish_at: iso(subDays(now, 6)), created_by: 'u-admin', created_at: iso(subDays(now, 6)), updated_at: iso(subDays(now, 6)) },
  ];

  return { users, profiles, members, voteSessions, voteResponses, matches, announcements, announcementReads: [] };
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm test seed.test`
Expected: 8 passed

- [ ] **Step 5: 커밋**

```bash
git add src/shared/api/adapters/collection/seed.ts src/shared/api/adapters/collection/seed.test.ts
git commit -m "feat(api): add deterministic seed data for the local adapter"
```

---

### Task 6: MemberRepo 컬렉션 구현 + 계약 테스트

**Files:**
- Create: `src/shared/api/adapters/collection/member-repo.ts`, `src/shared/api/adapters/contracts/member-repo.contract.ts`
- Test: `src/shared/api/adapters/collection/member-repo.test.ts`

**Interfaces:**
- Consumes: `MemberRepo` (Task 2), `Collection`/`MemoryStorage` (Task 3), `buildSeed` (Task 5)
- Produces: `createCollectionMemberRepo(members: Collection<Member>, now: () => Date): MemberRepo`, `runMemberRepoContract(makeRepo: () => Promise<{ repo: MemberRepo; seededCount: number }>)`

- [ ] **Step 1: 계약 테스트 + 실행 테스트 작성**

`src/shared/api/adapters/contracts/member-repo.contract.ts`:

```ts
import type { MemberRepo } from '@/shared/api/ports/member-repo';

const STATS = { speed: 50, shooting: 50, passing: 50, dribbling: 50, stamina: 50, defense: 50 };

/** 모든 MemberRepo 구현이 통과해야 하는 계약. supabase 어댑터도 나중에 같은 함수를 돌린다. */
export function runMemberRepoContract(makeRepo: () => Promise<{ repo: MemberRepo; seededCount: number }>) {
  describe('MemberRepo contract', () => {
    it('list는 시드 개수만큼, created_at 내림차순', async () => {
      const { repo, seededCount } = await makeRepo();
      const rows = await repo.list();
      expect(rows).toHaveLength(seededCount);
      for (let i = 1; i < rows.length; i += 1) {
        expect(rows[i - 1].created_at >= rows[i].created_at).toBe(true);
      }
    });

    it('create → get → update → remove', async () => {
      const { repo } = await makeRepo();
      const created = await repo.create({ name: '신규', phone_number: '010-1111-2222', stats: STATS });
      expect(created.id).toBeTruthy();
      expect(created.profile_photo).toBeNull();
      expect(await repo.get(created.id)).toMatchObject({ name: '신규' });
      const updated = await repo.update(created.id, { name: '수정' });
      expect(updated.name).toBe('수정');
      expect(updated.updated_at >= created.updated_at).toBe(true);
      await repo.remove(created.id);
      expect(await repo.get(created.id)).toBeNull();
    });

    it('없는 id는 get null, update는 reject', async () => {
      const { repo } = await makeRepo();
      expect(await repo.get('nope')).toBeNull();
      await expect(repo.update('nope', { name: 'x' })).rejects.toThrow();
    });
  });
}
```

`src/shared/api/adapters/collection/member-repo.test.ts`:

```ts
import { Collection } from '@/shared/api/adapters/collection/collection';
import { createCollectionMemberRepo } from '@/shared/api/adapters/collection/member-repo';
import { MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import { buildSeed } from '@/shared/api/adapters/collection/seed';
import { runMemberRepoContract } from '@/shared/api/adapters/contracts/member-repo.contract';

const NOW = new Date('2026-09-03T10:00:00+09:00');

runMemberRepoContract(async () => {
  const seed = buildSeed(NOW);
  const storage = new MemoryStorage();
  const members = new Collection(storage, 'members', () => seed.members);
  return { repo: createCollectionMemberRepo(members, () => NOW), seededCount: seed.members.length };
});

describe('createCollectionMemberRepo.uploadPhoto', () => {
  it('파일을 data URL로 돌려준다', async () => {
    const storage = new MemoryStorage();
    const repo = createCollectionMemberRepo(new Collection(storage, 'members', () => []), () => NOW);
    const file = new File(['hello'], 'a.png', { type: 'image/png' });
    const url = await repo.uploadPhoto(file, 'm-01');
    expect(url.startsWith('data:image/png;base64,')).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test member-repo.test`
Expected: FAIL — module not found

- [ ] **Step 3: 구현**

`src/shared/api/adapters/collection/member-repo.ts`:

```ts
import type { Collection } from '@/shared/api/adapters/collection/collection';
import type { MemberRepo } from '@/shared/api/ports/member-repo';
import type { Member } from '@/shared/types/member';

export function newId(): string {
  return crypto.randomUUID();
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('파일을 읽을 수 없습니다.'));
    reader.readAsDataURL(file);
  });
}

export function createCollectionMemberRepo(members: Collection<Member>, now: () => Date): MemberRepo {
  return {
    async list() {
      return (await members.all()).sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    get(id) {
      return members.get(id);
    },
    async create(data) {
      const at = now().toISOString();
      return members.insert({
        id: newId(),
        name: data.name,
        phone_number: data.phone_number,
        profile_photo: data.profile_photo ?? null,
        stats: data.stats,
        created_at: at,
        updated_at: at,
      });
    },
    update(id, data) {
      return members.update(id, { ...data, updated_at: now().toISOString() });
    },
    remove(id) {
      return members.remove(id);
    },
    uploadPhoto(file) {
      return fileToDataUrl(file);
    },
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm test member-repo.test`
Expected: 4 passed

- [ ] **Step 5: 커밋**

```bash
git add src/shared/api/adapters
git commit -m "feat(api): implement collection MemberRepo with shared contract test"
```

---

### Task 7: VoteRepo 컬렉션 구현 + 계약 테스트

**Files:**
- Create: `src/shared/api/adapters/collection/vote-repo.ts`, `src/shared/api/adapters/contracts/vote-repo.contract.ts`
- Test: `src/shared/api/adapters/collection/vote-repo.test.ts`

**Interfaces:**
- Consumes: `VoteRepo`, `RespondInput`, `VoteResponseWithMember` (Task 2), `newId` (Task 6)
- Produces: `createCollectionVoteRepo(deps: { sessions: Collection<VoteSession>; responses: Collection<VoteResponse>; members: Collection<Member>; now: () => Date }): VoteRepo`, `runVoteRepoContract(makeRepo)`

- [ ] **Step 1: 계약 테스트 + 실행 테스트 작성**

`src/shared/api/adapters/contracts/vote-repo.contract.ts`:

```ts
import type { VoteRepo } from '@/shared/api/ports/vote-repo';

export interface VoteRepoFixture {
  repo: VoteRepo;
  /** 시드에 존재하는 진행 중 세션 id와 응답이 없는 멤버 id */
  activeSessionId: string;
  unrespondedMemberId: string;
}

export function runVoteRepoContract(makeRepo: () => Promise<VoteRepoFixture>) {
  describe('VoteRepo contract', () => {
    it('listSessions는 event_date 내림차순, listActiveSessions는 활성만 오름차순', async () => {
      const { repo } = await makeRepo();
      const all = await repo.listSessions();
      for (let i = 1; i < all.length; i += 1) expect(all[i - 1].event_date >= all[i].event_date).toBe(true);
      const active = await repo.listActiveSessions();
      expect(active.every((s) => s.is_active)).toBe(true);
      for (let i = 1; i < active.length; i += 1) expect(active[i - 1].event_date <= active[i].event_date).toBe(true);
    });

    it('createSession은 is_active=true로 만들고 updateSession/removeSession이 동작한다', async () => {
      const { repo } = await makeRepo();
      const created = await repo.createSession({ title: '새 투표', type: 'other', event_date: '2030-01-01T00:00:00.000Z', deadline: '2029-12-31T00:00:00.000Z' });
      expect(created.is_active).toBe(true);
      expect(created.description).toBeNull();
      const closed = await repo.updateSession(created.id, { is_active: false });
      expect(closed.is_active).toBe(false);
      await repo.removeSession(created.id);
      expect(await repo.getSession(created.id)).toBeNull();
    });

    it('respond는 없으면 만들고 있으면 status만 바꾼다(upsert), listResponses는 멤버를 조인한다', async () => {
      const { repo, activeSessionId, unrespondedMemberId } = await makeRepo();
      const before = (await repo.listResponses(activeSessionId)).length;
      const first = await repo.respond({ sessionId: activeSessionId, memberId: unrespondedMemberId, status: 'attending' });
      expect(first.status).toBe('attending');
      const second = await repo.respond({ sessionId: activeSessionId, memberId: unrespondedMemberId, status: 'absent' });
      expect(second.id).toBe(first.id);
      expect(second.status).toBe('absent');
      const after = await repo.listResponses(activeSessionId);
      expect(after).toHaveLength(before + 1);
      const mine = after.find((r) => r.member_id === unrespondedMemberId)!;
      expect(mine.members?.id).toBe(unrespondedMemberId);
    });

    it('removeSession은 그 세션의 응답도 지운다', async () => {
      const { repo, activeSessionId } = await makeRepo();
      await repo.removeSession(activeSessionId);
      expect(await repo.listResponses(activeSessionId)).toEqual([]);
    });
  });
}
```

`src/shared/api/adapters/collection/vote-repo.test.ts`:

```ts
import { Collection } from '@/shared/api/adapters/collection/collection';
import { MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import { buildSeed } from '@/shared/api/adapters/collection/seed';
import { createCollectionVoteRepo } from '@/shared/api/adapters/collection/vote-repo';
import { runVoteRepoContract } from '@/shared/api/adapters/contracts/vote-repo.contract';

const NOW = new Date('2026-09-03T10:00:00+09:00');

runVoteRepoContract(async () => {
  const seed = buildSeed(NOW);
  const storage = new MemoryStorage();
  const repo = createCollectionVoteRepo({
    sessions: new Collection(storage, 'vote_sessions', () => seed.voteSessions),
    responses: new Collection(storage, 'vote_responses', () => seed.voteResponses),
    members: new Collection(storage, 'members', () => seed.members),
    now: () => NOW,
  });
  return { repo, activeSessionId: 'vs-this-week', unrespondedMemberId: 'm-20' };
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test vote-repo.test`
Expected: FAIL — module not found

- [ ] **Step 3: 구현**

`src/shared/api/adapters/collection/vote-repo.ts`:

```ts
import type { Collection } from '@/shared/api/adapters/collection/collection';
import { newId } from '@/shared/api/adapters/collection/member-repo';
import type { VoteRepo, VoteResponseWithMember } from '@/shared/api/ports/vote-repo';
import type { Member } from '@/shared/types/member';
import type { VoteResponse, VoteSession } from '@/shared/types/vote';

interface Deps {
  sessions: Collection<VoteSession>;
  responses: Collection<VoteResponse>;
  members: Collection<Member>;
  now: () => Date;
}

export function createCollectionVoteRepo({ sessions, responses, members, now }: Deps): VoteRepo {
  return {
    async listSessions() {
      return (await sessions.all()).sort((a, b) => b.event_date.localeCompare(a.event_date));
    },
    async listActiveSessions() {
      return (await sessions.all())
        .filter((s) => s.is_active)
        .sort((a, b) => a.event_date.localeCompare(b.event_date));
    },
    getSession(id) {
      return sessions.get(id);
    },
    async createSession(data) {
      const at = now().toISOString();
      return sessions.insert({
        id: newId(),
        title: data.title,
        description: data.description ?? null,
        type: data.type,
        event_date: data.event_date,
        deadline: data.deadline,
        is_active: true,
        created_at: at,
        updated_at: at,
      });
    },
    updateSession(id, data) {
      return sessions.update(id, { ...data, updated_at: now().toISOString() });
    },
    async removeSession(id) {
      await sessions.remove(id);
      const rest = (await responses.all()).filter((r) => r.session_id !== id);
      await responses.replaceAll(rest);
    },
    async listResponses(sessionId) {
      const [rows, memberRows] = await Promise.all([responses.all(), members.all()]);
      const byId = new Map(memberRows.map((m) => [m.id, m]));
      return rows
        .filter((r) => r.session_id === sessionId)
        .map<VoteResponseWithMember>((r) => ({ ...r, members: byId.get(r.member_id) ?? null }));
    },
    async respond({ sessionId, memberId, status }) {
      const at = now().toISOString();
      const existing = (await responses.all()).find((r) => r.session_id === sessionId && r.member_id === memberId);
      if (existing) {
        return responses.update(existing.id, { status, updated_at: at });
      }
      return responses.insert({ id: newId(), session_id: sessionId, member_id: memberId, status, created_at: at, updated_at: at });
    },
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm test vote-repo.test`
Expected: 4 passed

- [ ] **Step 5: 커밋**

```bash
git add src/shared/api/adapters
git commit -m "feat(api): implement collection VoteRepo with shared contract test"
```

---

### Task 8: MatchRepo 컬렉션 구현 + 계약 테스트

**Files:**
- Create: `src/shared/api/adapters/collection/match-repo.ts`, `src/shared/api/adapters/contracts/match-repo.contract.ts`
- Test: `src/shared/api/adapters/collection/match-repo.test.ts`

**Interfaces:**
- Consumes: `MatchRepo` (Task 2), `Collection` (Task 3), `newId` (Task 6)
- Produces: `createCollectionMatchRepo(matches: Collection<Match>, now: () => Date): MatchRepo`, `runMatchRepoContract(makeRepo)`

- [ ] **Step 1: 계약 테스트 + 실행 테스트 작성**

`src/shared/api/adapters/contracts/match-repo.contract.ts`:

```ts
import type { MatchRepo } from '@/shared/api/ports/match-repo';
import type { TeamMatchData } from '@/shared/types/match';

const emptyTeam = (name: string, ids: string[]): TeamMatchData => ({
  name, member_ids: ids, score: 0, players: ids.map((member_id) => ({ member_id, goals: 0, assists: 0, saves: 0, is_mvp: false })),
  goalkeeper_id: null, manager_id: null, substitutions: [], goals_detail: [],
});

export function runMatchRepoContract(makeRepo: () => Promise<{ repo: MatchRepo; seededCount: number }>) {
  describe('MatchRepo contract', () => {
    it('list는 date 내림차순', async () => {
      const { repo, seededCount } = await makeRepo();
      const rows = await repo.list();
      expect(rows).toHaveLength(seededCount);
      for (let i = 1; i < rows.length; i += 1) expect(rows[i - 1].date >= rows[i].date).toBe(true);
    });

    it('create는 status 기본 pending, 타이머 필드 null; update로 진행/종료 기록', async () => {
      const { repo } = await makeRepo();
      const created = await repo.create({
        date: '2030-01-04T07:00:00.000Z', location: '테스트장',
        team_a: emptyTeam('A', ['m-01']), team_b: emptyTeam('B', ['m-02']),
      });
      expect(created).toMatchObject({ status: 'pending', start_time: null, end_time: null, duration: null, notes: null, vote_session_id: null, match_number: null });
      const started = await repo.update(created.id, { status: 'in_progress', start_time: '2030-01-04T07:05:00.000Z', duration: 3000 });
      expect(started.status).toBe('in_progress');
      expect(await repo.get(created.id)).toMatchObject({ duration: 3000 });
      await repo.remove(created.id);
      expect(await repo.get(created.id)).toBeNull();
    });

    it('없는 id update는 reject', async () => {
      const { repo } = await makeRepo();
      await expect(repo.update('nope', { status: 'finished' })).rejects.toThrow();
    });
  });
}
```

`src/shared/api/adapters/collection/match-repo.test.ts`:

```ts
import { Collection } from '@/shared/api/adapters/collection/collection';
import { createCollectionMatchRepo } from '@/shared/api/adapters/collection/match-repo';
import { MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import { buildSeed } from '@/shared/api/adapters/collection/seed';
import { runMatchRepoContract } from '@/shared/api/adapters/contracts/match-repo.contract';

const NOW = new Date('2026-09-03T10:00:00+09:00');

runMatchRepoContract(async () => {
  const seed = buildSeed(NOW);
  const matches = new Collection(new MemoryStorage(), 'matches', () => seed.matches);
  return { repo: createCollectionMatchRepo(matches, () => NOW), seededCount: seed.matches.length };
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test match-repo.test`
Expected: FAIL — module not found

- [ ] **Step 3: 구현**

`src/shared/api/adapters/collection/match-repo.ts`:

```ts
import type { Collection } from '@/shared/api/adapters/collection/collection';
import { newId } from '@/shared/api/adapters/collection/member-repo';
import type { MatchRepo } from '@/shared/api/ports/match-repo';
import type { Match } from '@/shared/types/match';

export function createCollectionMatchRepo(matches: Collection<Match>, now: () => Date): MatchRepo {
  return {
    async list() {
      return (await matches.all()).sort((a, b) => b.date.localeCompare(a.date));
    },
    get(id) {
      return matches.get(id);
    },
    async create(data) {
      const at = now().toISOString();
      return matches.insert({
        id: newId(),
        date: data.date,
        location: data.location,
        team_a: data.team_a,
        team_b: data.team_b,
        notes: data.notes ?? null,
        vote_session_id: data.vote_session_id ?? null,
        match_number: data.match_number ?? null,
        status: data.status ?? 'pending',
        start_time: data.start_time ?? null,
        end_time: data.end_time ?? null,
        duration: data.duration ?? null,
        created_at: at,
        updated_at: at,
      });
    },
    update(id, data) {
      return matches.update(id, { ...data, updated_at: now().toISOString() });
    },
    remove(id) {
      return matches.remove(id);
    },
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm test match-repo.test`
Expected: 3 passed

- [ ] **Step 5: 커밋**

```bash
git add src/shared/api/adapters
git commit -m "feat(api): implement collection MatchRepo with shared contract test"
```

---

### Task 9: AnnouncementRepo 컬렉션 구현 + 계약 테스트

**Files:**
- Create: `src/shared/api/adapters/collection/announcement-repo.ts`, `src/shared/api/adapters/contracts/announcement-repo.contract.ts`
- Test: `src/shared/api/adapters/collection/announcement-repo.test.ts`

**Interfaces:**
- Consumes: `AnnouncementRepo` (Task 2), `Collection` (Task 3), `newId` (Task 6)
- Produces: `createCollectionAnnouncementRepo(deps: { announcements: Collection<Announcement>; reads: Collection<AnnouncementRead>; currentUserId: () => string | null; now: () => Date }): AnnouncementRepo`, `runAnnouncementRepoContract(makeRepo)`

- [ ] **Step 1: 계약 테스트 + 실행 테스트 작성**

`src/shared/api/adapters/contracts/announcement-repo.contract.ts`:

```ts
import type { AnnouncementRepo } from '@/shared/api/ports/announcement-repo';

export function runAnnouncementRepoContract(makeRepo: () => Promise<{ repo: AnnouncementRepo; currentUserId: string }>) {
  describe('AnnouncementRepo contract', () => {
    it('list는 고정 먼저, 그 다음 publish_at 내림차순', async () => {
      const { repo } = await makeRepo();
      const rows = await repo.list();
      const firstUnpinned = rows.findIndex((a) => !a.is_pinned);
      expect(rows.slice(0, firstUnpinned).every((a) => a.is_pinned)).toBe(true);
      const unpinned = rows.slice(firstUnpinned);
      for (let i = 1; i < unpinned.length; i += 1) expect(unpinned[i - 1].publish_at >= unpinned[i].publish_at).toBe(true);
    });

    it('create는 created_by를 현재 사용자로, publish_at 기본값을 채운다', async () => {
      const { repo, currentUserId } = await makeRepo();
      const created = await repo.create({ title: '제목', body: '본문', category: 'general' });
      expect(created.created_by).toBe(currentUserId);
      expect(created.is_pinned).toBe(false);
      expect(created.publish_at).toBeTruthy();
      const updated = await repo.update(created.id, { is_pinned: true });
      expect(updated.is_pinned).toBe(true);
      await repo.remove(created.id);
      expect(await repo.get(created.id)).toBeNull();
    });

    it('markRead는 (announcement, user) 기준 upsert, listReads는 그 사용자 것만', async () => {
      const { repo, currentUserId } = await makeRepo();
      const [first] = await repo.list();
      const a = await repo.markRead(first.id, currentUserId);
      const b = await repo.markRead(first.id, currentUserId);
      expect(b.id).toBe(a.id);
      const reads = await repo.listReads(currentUserId);
      expect(reads.filter((r) => r.announcement_id === first.id)).toHaveLength(1);
      expect(await repo.listReads('someone-else')).toEqual([]);
    });
  });
}
```

`src/shared/api/adapters/collection/announcement-repo.test.ts`:

```ts
import { createCollectionAnnouncementRepo } from '@/shared/api/adapters/collection/announcement-repo';
import { Collection } from '@/shared/api/adapters/collection/collection';
import { MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import { buildSeed } from '@/shared/api/adapters/collection/seed';
import { runAnnouncementRepoContract } from '@/shared/api/adapters/contracts/announcement-repo.contract';

const NOW = new Date('2026-09-03T10:00:00+09:00');

runAnnouncementRepoContract(async () => {
  const seed = buildSeed(NOW);
  const storage = new MemoryStorage();
  const repo = createCollectionAnnouncementRepo({
    announcements: new Collection(storage, 'announcements', () => seed.announcements),
    reads: new Collection(storage, 'announcement_reads', () => seed.announcementReads),
    currentUserId: () => 'u-admin',
    now: () => NOW,
  });
  return { repo, currentUserId: 'u-admin' };
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test announcement-repo.test`
Expected: FAIL — module not found

- [ ] **Step 3: 구현**

`src/shared/api/adapters/collection/announcement-repo.ts`:

```ts
import type { Collection } from '@/shared/api/adapters/collection/collection';
import { newId } from '@/shared/api/adapters/collection/member-repo';
import type { AnnouncementRepo } from '@/shared/api/ports/announcement-repo';
import type { Announcement, AnnouncementRead } from '@/shared/types/announcement';

interface Deps {
  announcements: Collection<Announcement>;
  reads: Collection<AnnouncementRead>;
  currentUserId: () => string | null;
  now: () => Date;
}

export function createCollectionAnnouncementRepo({ announcements, reads, currentUserId, now }: Deps): AnnouncementRepo {
  return {
    async list() {
      return (await announcements.all()).sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return b.publish_at.localeCompare(a.publish_at);
      });
    },
    get(id) {
      return announcements.get(id);
    },
    async create(data) {
      const at = now().toISOString();
      return announcements.insert({
        id: newId(),
        title: data.title,
        body: data.body,
        category: data.category,
        is_pinned: data.is_pinned ?? false,
        publish_at: data.publish_at ?? at,
        created_by: currentUserId(),
        created_at: at,
        updated_at: at,
      });
    },
    update(id, data) {
      return announcements.update(id, { ...data, updated_at: now().toISOString() });
    },
    async remove(id) {
      await announcements.remove(id);
      await reads.replaceAll((await reads.all()).filter((r) => r.announcement_id !== id));
    },
    async listReads(userId) {
      return (await reads.all()).filter((r) => r.user_id === userId);
    },
    async markRead(announcementId, userId) {
      const existing = (await reads.all()).find((r) => r.announcement_id === announcementId && r.user_id === userId);
      if (existing) return existing;
      return reads.insert({ id: newId(), announcement_id: announcementId, user_id: userId, created_at: now().toISOString() });
    },
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm test announcement-repo.test`
Expected: 3 passed

- [ ] **Step 5: 커밋**

```bash
git add src/shared/api/adapters
git commit -m "feat(api): implement collection AnnouncementRepo with shared contract test"
```

---

### Task 10: AuthRepo 컬렉션 구현 (세션 + 프로필 규칙) + 계약 테스트

**Files:**
- Create: `src/shared/api/adapters/collection/auth-repo.ts`, `src/shared/api/adapters/contracts/auth-repo.contract.ts`
- Test: `src/shared/api/adapters/collection/auth-repo.test.ts`

**Interfaces:**
- Consumes: `AuthRepo`, `AuthUser`, `DEMO_ACCOUNTS` (Task 2), `SessionStore`, `Collection` (Task 3), `normalizePhoneNumber` (`@/shared/lib/utils`)
- Produces: `createCollectionAuthRepo(deps: { users: Collection<AuthUser>; profiles: Collection<AppProfile>; members: Collection<Member>; session: SessionStore; now: () => Date }): AuthRepo`, `runAuthRepoContract(makeRepo)`

규칙(Supabase RPC `link_my_member` / `unlink_my_member` / `get_claimable_members` / `set_app_profile_role` / `update_my_member_profile`의 현행 계약을 TS로 옮긴 것):
- 모든 프로필 변경은 로그인 필요 → 아니면 `Error('로그인이 필요합니다.')`
- `linkMyMember`: 이미 다른 멤버와 연결 → `'이미 다른 멤버와 연결되어 있습니다. 먼저 연결을 해제해주세요.'`; 멤버 없음 → `'연결할 멤버를 찾을 수 없습니다.'`; 다른 계정에 연결됨 → `'이미 다른 계정에 연결된 멤버입니다.'`
- `setProfileRole`: superadmin 아님 → `'슈퍼관리자만 역할을 변경할 수 있습니다.'`; 자기 자신 → `'자기 자신의 역할은 이 화면에서 변경할 수 없습니다.'`; 대상 없음 → `'대상 프로필을 찾을 수 없습니다.'`; 대상이 superadmin → `'슈퍼관리자 계정은 이 화면에서 변경할 수 없습니다.'`
- `updateMyMemberProfile`: 이름 공백 → `'이름을 입력해주세요.'`; 전화 형식 `^(010|000)-\d{4}-\d{4}$` 아님 → `'전화번호는 010-1234-5678 또는 000-0000-0000 형식이어야 합니다.'`; 미연결 → `'먼저 내 멤버를 연결해주세요.'`
- `listClaimableMembers`: 어떤 프로필에도 연결되지 않았거나 내 프로필에 연결된 멤버, name 오름차순

- [ ] **Step 1: 계약 테스트 + 실행 테스트 작성**

`src/shared/api/adapters/contracts/auth-repo.contract.ts`:

```ts
import type { AuthRepo } from '@/shared/api/ports/auth-repo';

export interface AuthRepoFixture {
  repo: AuthRepo;
  /** 다른 계정에 이미 연결된 멤버 id (시드에서 m-02 = u-admin) */
  takenMemberId: string;
  /** 아무 계정에도 연결되지 않은 멤버 id */
  freeMemberId: string;
}

/** 로컬 어댑터는 signInAsDemo로 계정을 바꾼다. (supabase 어댑터에서 이 계약을 돌릴 땐 fixture가 대신 로그인해야 한다) */
export function runAuthRepoContract(makeRepo: () => Promise<AuthRepoFixture>) {
  describe('AuthRepo contract', () => {
    it('로그아웃 상태에서 getUser는 null, 변경은 로그인 필요', async () => {
      const { repo } = await makeRepo();
      await repo.signOut();
      expect(await repo.getUser()).toBeNull();
      await expect(repo.unlinkMyMember()).rejects.toThrow('로그인이 필요합니다.');
    });

    it('signInAsDemo → ensureProfile → onAuthStateChange 알림', async () => {
      const { repo } = await makeRepo();
      const seen: Array<string | null> = [];
      const unsubscribe = repo.onAuthStateChange((u) => seen.push(u?.id ?? null));
      const user = await repo.signInAsDemo('unlinked');
      expect(user.id).toBe('u-unlinked');
      const profile = await repo.ensureProfile(user);
      expect(profile).toMatchObject({ id: 'u-unlinked', role: 'member', member_id: null });
      await repo.signOut();
      unsubscribe();
      expect(seen).toEqual(['u-unlinked', null]);
    });

    it('link/unlink 규칙', async () => {
      const { repo, takenMemberId, freeMemberId } = await makeRepo();
      await repo.signInAsDemo('unlinked');
      await expect(repo.linkMyMember(takenMemberId)).rejects.toThrow('이미 다른 계정에 연결된 멤버입니다.');
      await expect(repo.linkMyMember('nope')).rejects.toThrow('연결할 멤버를 찾을 수 없습니다.');
      const linked = await repo.linkMyMember(freeMemberId);
      expect(linked.member_id).toBe(freeMemberId);
      await expect(repo.linkMyMember(takenMemberId)).rejects.toThrow('이미 다른 멤버와 연결되어 있습니다.');
      const claimable = await repo.listClaimableMembers();
      expect(claimable.some((m) => m.id === freeMemberId)).toBe(true);
      expect(claimable.some((m) => m.id === takenMemberId)).toBe(false);
      const unlinked = await repo.unlinkMyMember();
      expect(unlinked.member_id).toBeNull();
    });

    it('updateMyMemberProfile 규칙', async () => {
      const { repo, freeMemberId } = await makeRepo();
      await repo.signInAsDemo('unlinked');
      await expect(repo.updateMyMemberProfile({ name: '홍길동', phoneNumber: '010-1234-5678' })).rejects.toThrow('먼저 내 멤버를 연결해주세요.');
      await repo.linkMyMember(freeMemberId);
      await expect(repo.updateMyMemberProfile({ name: '  ', phoneNumber: '010-1234-5678' })).rejects.toThrow('이름을 입력해주세요.');
      await expect(repo.updateMyMemberProfile({ name: '홍길동', phoneNumber: '12' })).rejects.toThrow('형식이어야 합니다.');
      const member = await repo.updateMyMemberProfile({ name: ' 홍길동 ', phoneNumber: '01012345678' });
      expect(member).toMatchObject({ id: freeMemberId, name: '홍길동', phone_number: '010-1234-5678' });
    });

    it('setProfileRole 규칙', async () => {
      const { repo } = await makeRepo();
      await repo.signInAsDemo('admin');
      await expect(repo.setProfileRole('u-member', 'admin')).rejects.toThrow('슈퍼관리자만');
      await repo.signInAsDemo('superadmin');
      await expect(repo.setProfileRole('u-superadmin', 'member')).rejects.toThrow('자기 자신');
      await expect(repo.setProfileRole('nope', 'admin')).rejects.toThrow('대상 프로필을 찾을 수 없습니다.');
      const promoted = await repo.setProfileRole('u-member', 'admin');
      expect(promoted.role).toBe('admin');
      const profiles = await repo.listProfiles();
      expect(profiles[0].role).toBe('superadmin');
    });
  });
}
```

`src/shared/api/adapters/collection/auth-repo.test.ts`:

```ts
import { createCollectionAuthRepo } from '@/shared/api/adapters/collection/auth-repo';
import { Collection } from '@/shared/api/adapters/collection/collection';
import { MemorySessionStore, MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import { buildSeed } from '@/shared/api/adapters/collection/seed';
import { runAuthRepoContract } from '@/shared/api/adapters/contracts/auth-repo.contract';

const NOW = new Date('2026-09-03T10:00:00+09:00');

runAuthRepoContract(async () => {
  const seed = buildSeed(NOW);
  const storage = new MemoryStorage();
  const repo = createCollectionAuthRepo({
    users: new Collection(storage, 'users', () => seed.users),
    profiles: new Collection(storage, 'app_profiles', () => seed.profiles),
    members: new Collection(storage, 'members', () => seed.members),
    session: new MemorySessionStore(),
    now: () => NOW,
  });
  return { repo, takenMemberId: 'm-02', freeMemberId: 'm-10' };
});

describe('createCollectionAuthRepo.signInWithOAuth', () => {
  it('로컬 어댑터는 url null', async () => {
    const seed = buildSeed(NOW);
    const storage = new MemoryStorage();
    const repo = createCollectionAuthRepo({
      users: new Collection(storage, 'users', () => seed.users),
      profiles: new Collection(storage, 'app_profiles', () => seed.profiles),
      members: new Collection(storage, 'members', () => seed.members),
      session: new MemorySessionStore(),
      now: () => NOW,
    });
    expect(await repo.signInWithOAuth('google', 'http://localhost/auth/callback')).toEqual({ url: null });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test auth-repo.test`
Expected: FAIL — module not found

- [ ] **Step 3: 구현**

`src/shared/api/adapters/collection/auth-repo.ts`:

```ts
import type { Collection } from '@/shared/api/adapters/collection/collection';
import type { SessionStore } from '@/shared/api/adapters/collection/storage';
import { DEMO_ACCOUNTS, type AuthRepo, type AuthUser } from '@/shared/api/ports/auth-repo';
import { normalizePhoneNumber } from '@/shared/lib/utils';
import type { AppProfile } from '@/shared/types/auth';
import type { Member } from '@/shared/types/member';

interface Deps {
  users: Collection<AuthUser>;
  profiles: Collection<AppProfile>;
  members: Collection<Member>;
  session: SessionStore;
  now: () => Date;
}

const ROLE_ORDER: Record<AppProfile['role'], number> = { superadmin: 2, admin: 1, member: 0 };
const PHONE_PATTERN = /^(010|000)-\d{4}-\d{4}$/;

export function createCollectionAuthRepo({ users, profiles, members, session, now }: Deps): AuthRepo {
  const listeners = new Set<(user: AuthUser | null) => void>();

  const currentUser = async (): Promise<AuthUser | null> => {
    const id = session.get();
    return id ? users.get(id) : null;
  };

  const requireUser = async (): Promise<AuthUser> => {
    const user = await currentUser();
    if (!user) throw new Error('로그인이 필요합니다.');
    return user;
  };

  const ensureProfile = async (user: AuthUser): Promise<AppProfile> => {
    const existing = await profiles.get(user.id);
    if (existing) return existing;
    const at = now().toISOString();
    return profiles.insert({ id: user.id, email: user.email, role: 'member', member_id: null, created_at: at, updated_at: at });
  };

  const emit = (user: AuthUser | null) => listeners.forEach((listener) => listener(user));

  return {
    getUser: currentUser,
    onAuthStateChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async signInWithOAuth() {
      return { url: null };
    },
    async signInAsDemo(account) {
      const { id } = DEMO_ACCOUNTS[account];
      const user = await users.get(id);
      if (!user) throw new Error(`데모 계정 ${id}이(가) 시드에 없습니다.`);
      session.set(user.id);
      await ensureProfile(user);
      emit(user);
      return user;
    },
    async signOut() {
      session.clear();
      emit(null);
    },
    ensureProfile,
    async listProfiles() {
      return (await profiles.all()).sort((a, b) => {
        if (ROLE_ORDER[a.role] !== ROLE_ORDER[b.role]) return ROLE_ORDER[b.role] - ROLE_ORDER[a.role];
        return (a.email ?? '').localeCompare(b.email ?? '');
      });
    },
    async setProfileRole(targetProfileId, role) {
      const me = await ensureProfile(await requireUser());
      if (me.role !== 'superadmin') throw new Error('슈퍼관리자만 역할을 변경할 수 있습니다.');
      if (targetProfileId === me.id) throw new Error('자기 자신의 역할은 이 화면에서 변경할 수 없습니다.');
      const target = await profiles.get(targetProfileId);
      if (!target) throw new Error('대상 프로필을 찾을 수 없습니다.');
      if (target.role === 'superadmin') throw new Error('슈퍼관리자 계정은 이 화면에서 변경할 수 없습니다.');
      return profiles.update(targetProfileId, { role, updated_at: now().toISOString() });
    },
    async linkMyMember(memberId) {
      const me = await ensureProfile(await requireUser());
      if (me.member_id && me.member_id !== memberId) throw new Error('이미 다른 멤버와 연결되어 있습니다. 먼저 연결을 해제해주세요.');
      if (!(await members.get(memberId))) throw new Error('연결할 멤버를 찾을 수 없습니다.');
      const takenBy = (await profiles.all()).find((p) => p.member_id === memberId && p.id !== me.id);
      if (takenBy) throw new Error('이미 다른 계정에 연결된 멤버입니다.');
      return profiles.update(me.id, { member_id: memberId, updated_at: now().toISOString() });
    },
    async unlinkMyMember() {
      const me = await ensureProfile(await requireUser());
      return profiles.update(me.id, { member_id: null, updated_at: now().toISOString() });
    },
    async listClaimableMembers() {
      const me = await ensureProfile(await requireUser());
      const linkedElsewhere = new Set((await profiles.all()).filter((p) => p.member_id && p.id !== me.id).map((p) => p.member_id));
      return (await members.all())
        .filter((m) => !linkedElsewhere.has(m.id))
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    },
    async updateMyMemberProfile({ name, phoneNumber }) {
      const me = await ensureProfile(await requireUser());
      const trimmedName = name.trim();
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      if (!trimmedName) throw new Error('이름을 입력해주세요.');
      if (!PHONE_PATTERN.test(normalizedPhone)) throw new Error('전화번호는 010-1234-5678 또는 000-0000-0000 형식이어야 합니다.');
      if (!me.member_id) throw new Error('먼저 내 멤버를 연결해주세요.');
      return members.update(me.member_id, { name: trimmedName, phone_number: normalizedPhone, updated_at: now().toISOString() });
    },
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm test auth-repo.test`
Expected: 6 passed

- [ ] **Step 5: 커밋**

```bash
git add src/shared/api/adapters
git commit -m "feat(api): implement collection AuthRepo with linking and role rules"
```

---

### Task 11: `createCollectionApi` + Supabase 어댑터 이동 + `client.ts`

**Files:**
- Create: `src/shared/api/adapters/collection/create-api.ts`, `src/shared/api/adapters/supabase/create-api.ts`, `src/shared/api/client.ts`
- Modify: `src/shared/api/supabase/config.ts` (즉시 생성 → 지연 생성. 로컬 모드에서는 Supabase env가 없으므로 import만으로 클라이언트가 만들어지면 안 된다)
- (파일 이동·삭제는 Task 15에서. 여기서는 옛 경로를 그대로 import한다.)
- Test: `src/shared/api/adapters/collection/create-api.test.ts`, `src/shared/api/client.test.ts`

**Interfaces:**
- Consumes: Task 3~10의 모든 팩토리
- Produces:
  ```ts
  // adapters/collection/create-api.ts
  export function createCollectionApi(deps: { storage: CollectionStorage; session: SessionStore; now?: () => Date }): ClubApi
  // adapters/supabase/create-api.ts
  export function createSupabaseApi(): ClubApi
  // client.ts
  export type DataAdapter = 'local' | 'supabase';
  export function getDataAdapter(): DataAdapter;
  export function isLocalAdapter(): boolean;
  export function getApi(): ClubApi;              // 싱글턴
  export async function resetLocalData(): Promise<void>;   // 로컬 저장소 비우기(다음 읽기에 재시드)
  export function __setApiForTests(api: ClubApi | null): void;
  ```

- [ ] **Step 1: 테스트 작성**

`src/shared/api/adapters/collection/create-api.test.ts`:

```ts
import { createCollectionApi } from '@/shared/api/adapters/collection/create-api';
import { MemorySessionStore, MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';

const NOW = new Date('2026-09-03T10:00:00+09:00');

describe('createCollectionApi', () => {
  it('리포 5개가 같은 저장소를 공유하고 시드가 붙는다', async () => {
    const storage = new MemoryStorage();
    const api = createCollectionApi({ storage, session: new MemorySessionStore(), now: () => NOW });
    expect(await api.members.list()).toHaveLength(20);
    expect(await api.votes.listActiveSessions()).toHaveLength(2);
    expect(await api.matches.list()).toHaveLength(5);
    expect(await api.announcements.list()).toHaveLength(4);
    await api.auth.signInAsDemo('member');
    expect((await api.auth.ensureProfile((await api.auth.getUser())!)).member_id).toBe('m-01');
    // 공지 작성자는 현재 세션 사용자
    const created = await api.announcements.create({ title: 't', body: 'b', category: 'general' });
    expect(created.created_by).toBe('u-member');
  });

  it('storage.clear 후에는 다시 시드된다', async () => {
    const storage = new MemoryStorage();
    const api = createCollectionApi({ storage, session: new MemorySessionStore(), now: () => NOW });
    await api.members.create({ name: 'x', phone_number: '010-0000-0000', stats: { speed: 1, shooting: 1, passing: 1, dribbling: 1, stamina: 1, defense: 1 } });
    expect(await api.members.list()).toHaveLength(21);
    await storage.clear();
    expect(await api.members.list()).toHaveLength(20);
  });
});
```

`src/shared/api/client.test.ts`:

```ts
import { __setApiForTests, getApi, getDataAdapter } from '@/shared/api/client';

describe('client', () => {
  afterEach(() => {
    __setApiForTests(null);
    delete process.env.NEXT_PUBLIC_DATA_ADAPTER;
  });

  it('기본 어댑터는 local', () => {
    expect(getDataAdapter()).toBe('local');
  });

  it('env로 supabase를 고를 수 있다', () => {
    process.env.NEXT_PUBLIC_DATA_ADAPTER = 'supabase';
    expect(getDataAdapter()).toBe('supabase');
  });

  it('local에서 getApi는 싱글턴이고 시드를 돌려준다', async () => {
    const api = getApi();
    expect(getApi()).toBe(api);
    expect(await api.members.list()).toHaveLength(20);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test create-api.test client.test`
Expected: FAIL — module not found

- [ ] **Step 3: 컬렉션 API 팩토리 구현**

`src/shared/api/adapters/collection/create-api.ts`:

```ts
import { createCollectionAnnouncementRepo } from '@/shared/api/adapters/collection/announcement-repo';
import { createCollectionAuthRepo } from '@/shared/api/adapters/collection/auth-repo';
import { Collection } from '@/shared/api/adapters/collection/collection';
import { createCollectionMatchRepo } from '@/shared/api/adapters/collection/match-repo';
import { createCollectionMemberRepo } from '@/shared/api/adapters/collection/member-repo';
import { buildSeed } from '@/shared/api/adapters/collection/seed';
import type { CollectionStorage, SessionStore } from '@/shared/api/adapters/collection/storage';
import { createCollectionVoteRepo } from '@/shared/api/adapters/collection/vote-repo';
import type { ClubApi } from '@/shared/api/ports';

interface Deps {
  storage: CollectionStorage;
  session: SessionStore;
  now?: () => Date;
}

export function createCollectionApi({ storage, session, now = () => new Date() }: Deps): ClubApi {
  // 시드는 컬렉션이 처음 읽힐 때 한 번만 계산되도록 지연한다.
  let seedCache: ReturnType<typeof buildSeed> | null = null;
  const seed = () => (seedCache ??= buildSeed(now()));

  const users = new Collection(storage, 'users', () => seed().users);
  const profiles = new Collection(storage, 'app_profiles', () => seed().profiles);
  const members = new Collection(storage, 'members', () => seed().members);
  const voteSessions = new Collection(storage, 'vote_sessions', () => seed().voteSessions);
  const voteResponses = new Collection(storage, 'vote_responses', () => seed().voteResponses);
  const matches = new Collection(storage, 'matches', () => seed().matches);
  const announcements = new Collection(storage, 'announcements', () => seed().announcements);
  const reads = new Collection(storage, 'announcement_reads', () => seed().announcementReads);

  return {
    members: createCollectionMemberRepo(members, now),
    votes: createCollectionVoteRepo({ sessions: voteSessions, responses: voteResponses, members, now }),
    matches: createCollectionMatchRepo(matches, now),
    announcements: createCollectionAnnouncementRepo({ announcements, reads, currentUserId: () => session.get(), now }),
    auth: createCollectionAuthRepo({ users, profiles, members, session, now }),
  };
}
```

- [ ] **Step 4: Supabase 클라이언트를 지연 생성으로 바꾸고 어댑터 구현**

`src/shared/api/supabase/config.ts` 전체를 아래로 교체:

```ts
import { createBrowserClient } from '@supabase/ssr';

type BrowserClient = ReturnType<typeof createBrowserClient>;

let client: BrowserClient | null = null;

/** NEXT_PUBLIC_DATA_ADAPTER=supabase일 때만 호출된다. 로컬 모드에서는 env가 없어도 import가 안전해야 하므로 지연 생성한다. */
export function getSupabaseClient(): BrowserClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.');
  }
  client = createBrowserClient(url, anonKey);
  return client;
}
```

(기존 `export const supabase = ...`는 사라진다. 아직 옛 경로를 import하는 `entities/*/queries.ts`, `auth-provider.tsx`, `login-page-content.tsx`, `my-page-content.tsx`, `storage.ts`는 이 시점에 타입 오류가 나며 Task 12~15에서 순서대로 고친다.)

`src/shared/api/adapters/supabase/create-api.ts` — 현재 `entities/*/model/queries.ts`의 Supabase 호출을 포트로 옮긴 것. RPC는 현행 계약(마이그레이션 20260316 기준)만 지원한다:

```ts
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/shared/api/supabase/config';
import type { ClubApi } from '@/shared/api/ports';
import type { AuthUser } from '@/shared/api/ports/auth-repo';
import type { VoteResponseWithMember } from '@/shared/api/ports/vote-repo';
import { normalizePhoneNumber } from '@/shared/lib/utils';
import type { Announcement, AnnouncementRead } from '@/shared/types/announcement';
import type { AppProfile } from '@/shared/types/auth';
import type { Match } from '@/shared/types/match';
import type { Member } from '@/shared/types/member';
import type { VoteResponse, VoteSession } from '@/shared/types/vote';

function toAuthUser(user: User | null | undefined): AuthUser | null {
  return user ? { id: user.id, email: user.email ?? null } : null;
}

function throwIf(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export function createSupabaseApi(): ClubApi {
  const supabase = getSupabaseClient();
  return {
    members: {
      async list() {
        const { data, error } = await supabase.from('members').select('*').order('created_at', { ascending: false });
        throwIf(error);
        return (data ?? []) as Member[];
      },
      async get(id) {
        const { data, error } = await supabase.from('members').select('*').eq('id', id).maybeSingle();
        throwIf(error);
        return (data as Member | null) ?? null;
      },
      async create(input) {
        const { data, error } = await supabase.from('members').insert(input).select().single();
        throwIf(error);
        return data as Member;
      },
      async update(id, input) {
        const { data, error } = await supabase.from('members').update(input).eq('id', id).select().single();
        throwIf(error);
        return data as Member;
      },
      async remove(id) {
        const { error } = await supabase.from('members').delete().eq('id', id);
        throwIf(error);
      },
      async uploadPhoto(file, memberId) {
        const fileExt = file.name.split('.').pop();
        const filePath = `profiles/${memberId}-${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage.from('member-photos').upload(filePath, file, { cacheControl: '3600', upsert: false });
        throwIf(error);
        return supabase.storage.from('member-photos').getPublicUrl(filePath).data.publicUrl;
      },
    },

    votes: {
      async listSessions() {
        const { data, error } = await supabase.from('vote_sessions').select('*').order('event_date', { ascending: false });
        throwIf(error);
        return (data ?? []) as VoteSession[];
      },
      async listActiveSessions() {
        const { data, error } = await supabase.from('vote_sessions').select('*').eq('is_active', true).order('event_date', { ascending: true });
        throwIf(error);
        return (data ?? []) as VoteSession[];
      },
      async getSession(id) {
        const { data, error } = await supabase.from('vote_sessions').select('*').eq('id', id).maybeSingle();
        throwIf(error);
        return (data as VoteSession | null) ?? null;
      },
      async createSession(input) {
        const { data, error } = await supabase.from('vote_sessions').insert({ ...input, is_active: true }).select().single();
        throwIf(error);
        return data as VoteSession;
      },
      async updateSession(id, input) {
        const { data, error } = await supabase.from('vote_sessions').update(input).eq('id', id).select().single();
        throwIf(error);
        return data as VoteSession;
      },
      async removeSession(id) {
        const { error } = await supabase.from('vote_sessions').delete().eq('id', id);
        throwIf(error);
      },
      async listResponses(sessionId) {
        const { data, error } = await supabase.from('vote_responses').select('*, members(*)').eq('session_id', sessionId);
        throwIf(error);
        return (data ?? []) as VoteResponseWithMember[];
      },
      async respond({ sessionId, memberId, status }) {
        const { data, error } = await supabase
          .from('vote_responses')
          .upsert({ session_id: sessionId, member_id: memberId, status }, { onConflict: 'session_id,member_id' })
          .select()
          .single();
        throwIf(error);
        return data as VoteResponse;
      },
    },

    matches: {
      async list() {
        const { data, error } = await supabase.from('matches').select('*').order('date', { ascending: false });
        throwIf(error);
        return (data ?? []) as Match[];
      },
      async get(id) {
        const { data, error } = await supabase.from('matches').select('*').eq('id', id).maybeSingle();
        throwIf(error);
        return (data as Match | null) ?? null;
      },
      async create(input) {
        const { data, error } = await supabase
          .from('matches')
          .insert({ ...input, status: input.status ?? 'pending', start_time: input.start_time ?? null, end_time: input.end_time ?? null, duration: input.duration ?? null })
          .select()
          .single();
        throwIf(error);
        return data as Match;
      },
      async update(id, input) {
        const { data, error } = await supabase.from('matches').update(input).eq('id', id).select().single();
        throwIf(error);
        return data as Match;
      },
      async remove(id) {
        const { error } = await supabase.from('matches').delete().eq('id', id);
        throwIf(error);
      },
    },

    announcements: {
      async list() {
        const { data, error } = await supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('publish_at', { ascending: false });
        throwIf(error);
        return (data ?? []) as Announcement[];
      },
      async get(id) {
        const { data, error } = await supabase.from('announcements').select('*').eq('id', id).maybeSingle();
        throwIf(error);
        return (data as Announcement | null) ?? null;
      },
      async create(input) {
        const { data, error } = await supabase
          .from('announcements')
          .insert({ ...input, publish_at: input.publish_at ?? new Date().toISOString() })
          .select('*')
          .single();
        throwIf(error);
        return data as Announcement;
      },
      async update(id, input) {
        const { data, error } = await supabase.from('announcements').update(input).eq('id', id).select('*').single();
        throwIf(error);
        return data as Announcement;
      },
      async remove(id) {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        throwIf(error);
      },
      async listReads(userId) {
        const { data, error } = await supabase.from('announcement_reads').select('*').eq('user_id', userId);
        throwIf(error);
        return (data ?? []) as AnnouncementRead[];
      },
      async markRead(announcementId, userId) {
        const { data, error } = await supabase
          .from('announcement_reads')
          .upsert({ announcement_id: announcementId, user_id: userId }, { onConflict: 'announcement_id,user_id' })
          .select('*')
          .single();
        throwIf(error);
        return data as AnnouncementRead;
      },
    },

    auth: {
      async getUser() {
        const { data } = await supabase.auth.getUser();
        return toAuthUser(data.user);
      },
      onAuthStateChange(listener) {
        const { data } = supabase.auth.onAuthStateChange((_event, session) => listener(toAuthUser(session?.user)));
        return () => data.subscription.unsubscribe();
      },
      async signInWithOAuth(provider, redirectTo) {
        const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
        throwIf(error);
        return { url: data?.url ?? null };
      },
      async signInAsDemo() {
        throw new Error('데모 로그인은 로컬 어댑터에서만 사용할 수 있습니다.');
      },
      async signOut() {
        await supabase.auth.signOut();
      },
      async ensureProfile(user) {
        const { data: existing, error: selectError } = await supabase.from('app_profiles').select('*').eq('id', user.id).maybeSingle();
        throwIf(selectError);
        if (existing) return existing as AppProfile;
        const { data, error } = await supabase.from('app_profiles').insert({ id: user.id, email: user.email }).select('*').single();
        if (error) {
          const { data: retried } = await supabase.from('app_profiles').select('*').eq('id', user.id).maybeSingle();
          if (retried) return retried as AppProfile;
          throw new Error(error.message);
        }
        return data as AppProfile;
      },
      async listProfiles() {
        const { data, error } = await supabase.from('app_profiles').select('*').order('role', { ascending: false }).order('email', { ascending: true });
        throwIf(error);
        return (data ?? []) as AppProfile[];
      },
      async setProfileRole(targetProfileId, role) {
        const { data, error } = await supabase.rpc('set_app_profile_role', { target_profile_id: targetProfileId, next_role: role });
        throwIf(error);
        return data as AppProfile;
      },
      async linkMyMember(memberId) {
        const { data, error } = await supabase.rpc('link_my_member', { target_member_id: memberId });
        throwIf(error);
        return data as AppProfile;
      },
      async unlinkMyMember() {
        const { data, error } = await supabase.rpc('unlink_my_member');
        throwIf(error);
        return data as AppProfile;
      },
      async listClaimableMembers() {
        const { data, error } = await supabase.rpc('get_claimable_members');
        throwIf(error);
        return (data ?? []) as Member[];
      },
      async updateMyMemberProfile({ name, phoneNumber }) {
        const { data, error } = await supabase.rpc('update_my_member_profile', { input_name: name.trim(), input_phone: normalizePhoneNumber(phoneNumber) });
        throwIf(error);
        return data as Member;
      },
    },
  };
}
```

- [ ] **Step 5: `client.ts` 구현**

`src/shared/api/client.ts`:

```ts
import { createCollectionApi } from '@/shared/api/adapters/collection/create-api';
import { BrowserSessionStore, IdbStorage } from '@/shared/api/adapters/collection/idb-storage';
import { MemorySessionStore, MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import type { CollectionStorage, SessionStore } from '@/shared/api/adapters/collection/storage';
import { createSupabaseApi } from '@/shared/api/adapters/supabase/create-api';
import type { ClubApi } from '@/shared/api/ports';

export type DataAdapter = 'local' | 'supabase';

export function getDataAdapter(): DataAdapter {
  return process.env.NEXT_PUBLIC_DATA_ADAPTER === 'supabase' ? 'supabase' : 'local';
}

export function isLocalAdapter(): boolean {
  return getDataAdapter() === 'local';
}

let api: ClubApi | null = null;
let localStorageRef: CollectionStorage | null = null;

function createLocalDeps(): { storage: CollectionStorage; session: SessionStore } {
  // SSR·테스트처럼 브라우저 저장소가 없으면 메모리로 대체한다.
  const hasBrowserStorage = typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
  return hasBrowserStorage
    ? { storage: new IdbStorage(), session: new BrowserSessionStore() }
    : { storage: new MemoryStorage(), session: new MemorySessionStore() };
}

export function getApi(): ClubApi {
  if (api) return api;
  if (getDataAdapter() === 'supabase') {
    api = createSupabaseApi();
  } else {
    const deps = createLocalDeps();
    localStorageRef = deps.storage;
    api = createCollectionApi(deps);
  }
  return api;
}

/** 로컬 저장소를 비운다. 다음 읽기에서 다시 시드된다. 호출자가 페이지를 새로고침해야 한다. */
export async function resetLocalData(): Promise<void> {
  if (!localStorageRef) getApi();
  await localStorageRef?.clear();
}

export function __setApiForTests(next: ClubApi | null): void {
  api = next;
  localStorageRef = null;
}
```

- [ ] **Step 6: 테스트·타입체크 확인**

Run: `pnpm test create-api.test client.test`
Expected: 5 passed

Run: `pnpm type-check`
Expected: 오류는 **오직** 사라진 `supabase` export를 쓰는 파일들(`entities/*/model/queries.ts` 6개, `providers/auth-provider.tsx`, `widgets/login/ui/login-page-content.tsx`, `widgets/me/ui/my-page-content.tsx`, `shared/api/supabase/storage.ts`)뿐이어야 한다. 이들은 Task 12~15에서 고친다. 새 파일(`adapters/**`, `client.ts`)에는 오류가 없어야 한다.

- [ ] **Step 7: 커밋**

```bash
git add -A src/shared/api
git commit -m "feat(api): add collection API factory, supabase adapter and adapter-selecting client"
```

---

### Task 12: member / match / announcement 쿼리 훅을 `getApi()`로 교체

**Files:**
- Modify: `src/entities/member/model/queries.ts`, `src/entities/match/model/queries.ts`, `src/entities/announcement/model/queries.ts`
- Test: `src/entities/member/model/queries.test.tsx`

**Interfaces:**
- Consumes: `getApi()` (Task 11)
- Produces: 훅 이름·쿼리 키·반환 타입 **불변**. 소비자(위젯/피처)는 수정하지 않는다.

- [ ] **Step 1: 훅 테스트 작성 (공용 테스트 헬퍼 포함)**

`src/shared/lib/test/query-wrapper.tsx` (테스트 전용 헬퍼, 여러 Task에서 재사용):

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { __setApiForTests } from '@/shared/api/client';
import { createCollectionApi } from '@/shared/api/adapters/collection/create-api';
import { MemorySessionStore, MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import type { ClubApi } from '@/shared/api/ports';

export const TEST_NOW = new Date('2026-09-03T10:00:00+09:00');

/** 메모리 어댑터를 getApi()에 꽂고 QueryClientProvider 래퍼를 돌려준다. */
export function setupTestApi(now: Date = TEST_NOW): { api: ClubApi; wrapper: ({ children }: { children: ReactNode }) => JSX.Element } {
  const api = createCollectionApi({ storage: new MemoryStorage(), session: new MemorySessionStore(), now: () => now });
  __setApiForTests(api);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { api, wrapper };
}
```

`src/entities/member/model/queries.test.tsx`:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { useCreateMember, useMembers } from '@/entities/member/model/queries';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

const STATS = { speed: 50, shooting: 50, passing: 50, dribbling: 50, stamina: 50, defense: 50 };

describe('member queries', () => {
  afterEach(() => __setApiForTests(null));

  it('useMembers는 시드 20명을 돌려주고, useCreateMember 후 목록이 갱신된다', async () => {
    const { wrapper } = setupTestApi();
    const { result } = renderHook(() => ({ list: useMembers(), create: useCreateMember() }), { wrapper });
    await waitFor(() => expect(result.current.list.data).toHaveLength(20));
    await act(async () => {
      await result.current.create.mutateAsync({ name: '새 멤버', phone_number: '010-9999-0000', stats: STATS });
    });
    await waitFor(() => expect(result.current.list.data).toHaveLength(21));
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test entities/member`
Expected: FAIL — `@/shared/api/supabase/config`를 import하는 queries.ts가 깨져 있거나(Task 11 이후), 아직 getApi를 안 써서 네트워크 호출 시도

- [ ] **Step 3: member queries 교체**

`src/entities/member/model/queries.ts` 전체를 아래로 교체:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApi } from '@/shared/api/client';
import type { CreateMemberData, Member, UpdateMemberData } from '@/shared/types/member';

export const memberKeys = {
  all: ['members'] as const,
  lists: () => [...memberKeys.all, 'list'] as const,
  list: (filters?: string) => [...memberKeys.lists(), { filters }] as const,
  details: () => [...memberKeys.all, 'detail'] as const,
  detail: (id: string) => [...memberKeys.details(), id] as const,
};

export function useMembers() {
  return useQuery({ queryKey: memberKeys.lists(), queryFn: () => getApi().members.list() });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: memberKeys.detail(id),
    queryFn: async (): Promise<Member> => {
      const member = await getApi().members.get(id);
      if (!member) throw new Error('멤버를 찾을 수 없습니다.');
      return member;
    },
    enabled: !!id,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemberData) => getApi().members.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberData }) => getApi().members.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getApi().members.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}
```

- [ ] **Step 4: match queries 교체**

`src/entities/match/model/queries.ts` 전체를 아래로 교체:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApi } from '@/shared/api/client';
import type { CreateMatchData, Match, UpdateMatchData } from '@/shared/types/match';

export const matchKeys = {
  all: ['matches'] as const,
  lists: () => [...matchKeys.all, 'list'] as const,
  list: (filters?: string) => [...matchKeys.lists(), { filters }] as const,
  details: () => [...matchKeys.all, 'detail'] as const,
  detail: (id: string) => [...matchKeys.details(), id] as const,
};

export function useMatches() {
  return useQuery({ queryKey: matchKeys.lists(), queryFn: () => getApi().matches.list() });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: matchKeys.detail(id),
    queryFn: async (): Promise<Match> => {
      const match = await getApi().matches.get(id);
      if (!match) throw new Error('경기를 찾을 수 없습니다.');
      return match;
    },
    enabled: !!id,
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMatchData) => getApi().matches.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMatchData }) => getApi().matches.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
}

export function useDeleteMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getApi().matches.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
}
```

- [ ] **Step 5: announcement queries 교체**

`src/entities/announcement/model/queries.ts` 전체를 아래로 교체 (스키마 누락 우회 로직 `isAnnouncementSchemaMissing`은 삭제 — 어댑터 책임):

```ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApi } from '@/shared/api/client';
import type { AnnouncementRead, CreateAnnouncementData, UpdateAnnouncementData } from '@/shared/types/announcement';

export const announcementKeys = {
  all: ['announcements'] as const,
  lists: () => [...announcementKeys.all, 'list'] as const,
  detail: (id: string) => [...announcementKeys.all, 'detail', id] as const,
  reads: () => [...announcementKeys.all, 'reads'] as const,
  readsByUser: (userId?: string) => [...announcementKeys.reads(), userId] as const,
};

export function useAnnouncements() {
  return useQuery({ queryKey: announcementKeys.lists(), queryFn: () => getApi().announcements.list() });
}

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: announcementKeys.detail(id),
    queryFn: () => getApi().announcements.get(id),
    enabled: !!id,
  });
}

export function useAnnouncementReads(userId?: string | null) {
  return useQuery({
    queryKey: announcementKeys.readsByUser(userId ?? undefined),
    queryFn: async (): Promise<AnnouncementRead[]> => (userId ? getApi().announcements.listReads(userId) : []),
    enabled: !!userId,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAnnouncementData) => getApi().announcements.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementData }) => getApi().announcements.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: announcementKeys.detail(variables.id) });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getApi().announcements.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
}

export function useMarkAnnouncementRead(userId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (announcementId: string) => {
      if (!userId) throw new Error('로그인이 필요합니다.');
      return getApi().announcements.markRead(announcementId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.readsByUser(userId ?? undefined) });
    },
  });
}
```

- [ ] **Step 6: 통과 확인**

Run: `pnpm test entities/member`
Expected: 1 passed

- [ ] **Step 7: 커밋**

```bash
git add src/entities/member src/entities/match src/entities/announcement src/shared/lib/test
git commit -m "refactor(entities): route member, match and announcement queries through the data adapter"
```

---

### Task 13: vote 쿼리 교체 + attendance 쿼리를 vote 위의 매핑으로 재구현

**Files:**
- Modify: `src/entities/vote/model/queries.ts`, `src/entities/attendance/model/queries.ts`
- Test: `src/entities/attendance/model/queries.test.tsx`

**Interfaces:**
- Consumes: `getApi().votes` (Task 11), `setupTestApi` (Task 12)
- Produces: vote 훅 불변. attendance 훅(`useCurrentAttendanceSession`, `useAttendanceVotes`, `useVoteAttendance`, `useCreateAttendanceSession`)의 이름·반환 타입 불변, 내부는 `type: 'match'` 투표 세션에 매핑. 매핑 규칙:
  - 현재 출석 세션 = `listActiveSessions()` 중 `type === 'match'`인 첫 번째(event_date 오름차순 = 가장 가까운 경기). 없으면 `null`.
  - `AttendanceSession` = `{ id, match_date: event_date, deadline, is_active, created_at }`
  - `AttendanceVote & { members }` = 응답 + 세션의 `match_date/deadline`
  - `useCreateAttendanceSession({ match_date, deadline })` = 활성 `match` 세션 전부 `is_active: false`로 닫고, `title: '${M}월 ${d}일 정기 경기'`, `type: 'match'`인 세션 생성

- [ ] **Step 1: 테스트 작성**

`src/entities/attendance/model/queries.test.tsx`:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  useAttendanceVotes,
  useCreateAttendanceSession,
  useCurrentAttendanceSession,
  useVoteAttendance,
} from '@/entities/attendance/model/queries';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

describe('attendance queries (mapped onto match votes)', () => {
  afterEach(() => __setApiForTests(null));

  it('현재 출석 세션은 가장 가까운 활성 경기 투표다', async () => {
    const { wrapper } = setupTestApi();
    const { result } = renderHook(() => useCurrentAttendanceSession(), { wrapper });
    await waitFor(() => expect(result.current.data).not.toBeUndefined());
    expect(result.current.data).toMatchObject({ id: 'vs-this-week', is_active: true });
    expect(result.current.data?.match_date).toBeTruthy();
  });

  it('출석 응답은 세션 날짜와 멤버를 포함하고, useVoteAttendance로 upsert된다', async () => {
    const { wrapper } = setupTestApi();
    const { result } = renderHook(() => ({ votes: useAttendanceVotes('vs-this-week'), vote: useVoteAttendance() }), { wrapper });
    await waitFor(() => expect(result.current.votes.data).toHaveLength(12));
    expect(result.current.votes.data![0].members?.name).toBeTruthy();
    await act(async () => {
      await result.current.vote.mutateAsync({ sessionId: 'vs-this-week', memberId: 'm-20', status: 'attending' });
    });
    await waitFor(() => expect(result.current.votes.data).toHaveLength(13));
  });

  it('새 출석 세션을 만들면 기존 활성 경기 투표는 닫힌다', async () => {
    const { wrapper, api } = setupTestApi();
    const { result } = renderHook(() => ({ create: useCreateAttendanceSession(), current: useCurrentAttendanceSession() }), { wrapper });
    await waitFor(() => expect(result.current.current.data?.id).toBe('vs-this-week'));
    await act(async () => {
      await result.current.create.mutateAsync({ match_date: '2026-09-19T07:00:00.000Z', deadline: '2026-09-18T14:59:00.000Z' });
    });
    await waitFor(() => expect(result.current.current.data?.id).not.toBe('vs-this-week'));
    const old = await api.votes.getSession('vs-this-week');
    expect(old?.is_active).toBe(false);
    expect(result.current.current.data?.match_date).toBe('2026-09-19T07:00:00.000Z');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test entities/attendance`
Expected: FAIL

- [ ] **Step 3: vote queries 교체**

`src/entities/vote/model/queries.ts` 전체를 아래로 교체:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApi } from '@/shared/api/client';
import type { RespondInput } from '@/shared/api/ports/vote-repo';
import type { CreateVoteSessionData, UpdateVoteSessionData, VoteSession } from '@/shared/types/vote';

export const voteKeys = {
  all: ['votes'] as const,
  sessions: () => [...voteKeys.all, 'sessions'] as const,
  session: (id: string) => [...voteKeys.sessions(), id] as const,
  responses: () => [...voteKeys.all, 'responses'] as const,
  responsesBySession: (sessionId: string) => [...voteKeys.responses(), sessionId] as const,
  activeSessions: () => [...voteKeys.all, 'active-sessions'] as const,
};

export function useVoteSessions() {
  return useQuery({ queryKey: voteKeys.sessions(), queryFn: () => getApi().votes.listSessions() });
}

export function useActiveVoteSessions() {
  return useQuery({ queryKey: voteKeys.activeSessions(), queryFn: () => getApi().votes.listActiveSessions() });
}

export function useVoteSession(id: string) {
  return useQuery({
    queryKey: voteKeys.session(id),
    queryFn: async (): Promise<VoteSession> => {
      const session = await getApi().votes.getSession(id);
      if (!session) throw new Error('투표를 찾을 수 없습니다.');
      return session;
    },
    enabled: !!id,
  });
}

export function useVoteResponses(sessionId: string) {
  return useQuery({
    queryKey: voteKeys.responsesBySession(sessionId),
    queryFn: () => getApi().votes.listResponses(sessionId),
    enabled: !!sessionId,
  });
}

export function useCreateVoteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVoteSessionData) => getApi().votes.createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voteKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: voteKeys.activeSessions() });
    },
  });
}

export function useUpdateVoteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVoteSessionData }) => getApi().votes.updateSession(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: voteKeys.session(variables.id) });
      queryClient.invalidateQueries({ queryKey: voteKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: voteKeys.activeSessions() });
    },
  });
}

export function useVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RespondInput) => getApi().votes.respond(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: voteKeys.responsesBySession(variables.sessionId) });
    },
  });
}

export function useDeleteVoteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getApi().votes.removeSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voteKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: voteKeys.activeSessions() });
    },
  });
}
```

- [ ] **Step 4: attendance queries 재구현**

`src/entities/attendance/model/queries.ts` 전체를 아래로 교체:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { voteKeys } from '@/entities/vote/model/queries';
import { getApi } from '@/shared/api/client';
import type { AttendanceSession, AttendanceVote } from '@/shared/types/attendance';
import type { Member } from '@/shared/types/member';
import type { VoteSession } from '@/shared/types/vote';

/**
 * 출석은 별도 테이블이 아니라 `type: 'match'` 투표 세션이다(스펙 §1 출석→투표 흡수).
 * 이 모듈은 옛 출석 위젯이 기대하는 형태로 매핑만 한다. Phase 3에서 위젯이 재작성되면 함께 삭제한다.
 */
export const attendanceKeys = {
  all: ['attendance'] as const,
  sessions: () => [...attendanceKeys.all, 'sessions'] as const,
  session: (id: string) => [...attendanceKeys.sessions(), id] as const,
  votes: () => [...attendanceKeys.all, 'votes'] as const,
  votesBySession: (sessionId: string) => [...attendanceKeys.votes(), sessionId] as const,
  currentSession: () => [...attendanceKeys.all, 'current-session'] as const,
};

function toAttendanceSession(session: VoteSession): AttendanceSession {
  return { id: session.id, match_date: session.event_date, deadline: session.deadline, is_active: session.is_active, created_at: session.created_at };
}

export function useCurrentAttendanceSession() {
  return useQuery({
    queryKey: attendanceKeys.currentSession(),
    queryFn: async (): Promise<AttendanceSession | null> => {
      const active = await getApi().votes.listActiveSessions();
      const match = active.find((session) => session.type === 'match');
      return match ? toAttendanceSession(match) : null;
    },
  });
}

export function useAttendanceVotes(sessionId: string) {
  return useQuery({
    queryKey: attendanceKeys.votesBySession(sessionId),
    queryFn: async (): Promise<(AttendanceVote & { members: Member | null })[]> => {
      const api = getApi();
      const [session, responses] = await Promise.all([api.votes.getSession(sessionId), api.votes.listResponses(sessionId)]);
      if (!session) return [];
      return responses.map((response) => ({
        id: response.id,
        match_date: session.event_date,
        deadline: session.deadline,
        member_id: response.member_id,
        status: response.status,
        created_at: response.created_at,
        updated_at: response.updated_at,
        members: response.members,
      }));
    },
    enabled: !!sessionId,
  });
}

export function useVoteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { sessionId: string; memberId: string; status: 'attending' | 'absent' }) => getApi().votes.respond(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.votesBySession(variables.sessionId) });
      queryClient.invalidateQueries({ queryKey: voteKeys.responsesBySession(variables.sessionId) });
    },
  });
}

export function useCreateAttendanceSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { match_date: string; deadline: string }): Promise<AttendanceSession> => {
      const api = getApi();
      const active = await api.votes.listActiveSessions();
      await Promise.all(active.filter((s) => s.type === 'match').map((s) => api.votes.updateSession(s.id, { is_active: false })));
      const created = await api.votes.createSession({
        title: `${format(new Date(data.match_date), 'M월 d일')} 정기 경기`,
        type: 'match',
        event_date: data.match_date,
        deadline: data.deadline,
      });
      return toAttendanceSession(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({ queryKey: voteKeys.all });
    },
  });
}
```

- [ ] **Step 5: 통과 확인**

Run: `pnpm test entities/attendance`
Expected: 3 passed

- [ ] **Step 6: 커밋**

```bash
git add src/entities/vote src/entities/attendance
git commit -m "refactor(entities): route vote queries through the adapter and map attendance onto match votes"
```

---

### Task 14: auth 쿼리 + AuthProvider를 `AuthUser` 기반으로 교체

**Files:**
- Modify: `src/entities/auth/model/queries.ts`, `src/providers/auth-provider.tsx`
- Test: `src/entities/auth/model/queries.test.tsx`

**Interfaces:**
- Consumes: `getApi().auth`, `AuthUser` (Task 2/11)
- Produces: 훅 시그니처는 `User` → `AuthUser`만 바뀐다: `useAuthProfile(user: AuthUser | null)`. `useClaimableMembers`는 이제 `Member[]`만 돌려준다(`null` 레거시 분기 제거). `useAuth()`의 `user`는 `AuthUser | null`. 그 외 필드(`profile, member, isLoading, isAdmin, isSuperAdmin, isLinked`) 불변.

- [ ] **Step 1: 테스트 작성**

`src/entities/auth/model/queries.test.tsx`:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAuthProfile, useClaimableMembers, useLinkMemberProfile, useUnlinkMemberProfile } from '@/entities/auth/model/queries';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

describe('auth queries', () => {
  afterEach(() => __setApiForTests(null));

  it('프로필을 보장하고, 멤버 연결/해제가 쿼리를 갱신한다', async () => {
    const { api, wrapper } = setupTestApi();
    const user = await api.auth.signInAsDemo('unlinked');
    const { result } = renderHook(
      () => ({
        profile: useAuthProfile(user),
        claimable: useClaimableMembers(user.id),
        link: useLinkMemberProfile(user.id),
        unlink: useUnlinkMemberProfile(user.id),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.profile.data?.member_id).toBeNull());
    await waitFor(() => expect(result.current.claimable.data?.length).toBeGreaterThan(0));
    expect(result.current.claimable.data!.some((m) => m.id === 'm-02')).toBe(false); // u-admin에 연결됨

    await act(async () => {
      await result.current.link.mutateAsync({ memberId: 'm-10' });
    });
    await waitFor(() => expect(result.current.profile.data?.member_id).toBe('m-10'));

    await act(async () => {
      await result.current.unlink.mutateAsync();
    });
    await waitFor(() => expect(result.current.profile.data?.member_id).toBeNull());
  });

  it('로그아웃 상태면 프로필 쿼리는 비활성', () => {
    const { wrapper } = setupTestApi();
    const { result } = renderHook(() => useAuthProfile(null), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test entities/auth`
Expected: FAIL

- [ ] **Step 3: auth queries 교체**

`src/entities/auth/model/queries.ts` 전체를 아래로 교체 (레거시 RPC 재시도 로직 전부 삭제):

```ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memberKeys } from '@/entities/member/model/queries';
import { getApi } from '@/shared/api/client';
import type { AuthUser } from '@/shared/api/ports/auth-repo';
import type { AppProfile } from '@/shared/types/auth';

export const authKeys = {
  all: ['auth'] as const,
  profile: (userId?: string) => [...authKeys.all, 'profile', userId] as const,
  adminProfiles: () => [...authKeys.all, 'admin-profiles'] as const,
  claimableMembers: (userId?: string) => [...authKeys.all, 'claimable-members', userId] as const,
};

export function useAuthProfile(user: AuthUser | null) {
  return useQuery({
    queryKey: authKeys.profile(user?.id),
    queryFn: () => (user ? getApi().auth.ensureProfile(user) : null),
    enabled: !!user,
  });
}

export function useAdminProfiles(enabled: boolean) {
  return useQuery({ queryKey: authKeys.adminProfiles(), queryFn: () => getApi().auth.listProfiles(), enabled });
}

export function useUpdateAppProfileRole(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, role }: { profileId: string; role: Extract<AppProfile['role'], 'member' | 'admin'> }) => {
      if (!userId) throw new Error('로그인이 필요합니다.');
      return getApi().auth.setProfileRole(profileId, role);
    },
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: authKeys.adminProfiles() });
      queryClient.invalidateQueries({ queryKey: authKeys.profile(profile.id) });
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}

export function useLinkMemberProfile(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId }: { memberId: string; phoneNumber?: string }) => {
      if (!userId) throw new Error('로그인이 필요합니다.');
      return getApi().auth.linkMyMember(memberId);
    },
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: authKeys.profile(userId ?? undefined) });
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
      if (profile.member_id) queryClient.invalidateQueries({ queryKey: memberKeys.detail(profile.member_id) });
      queryClient.invalidateQueries({ queryKey: authKeys.claimableMembers(userId ?? undefined) });
    },
  });
}

export function useClaimableMembers(userId: string | null) {
  return useQuery({
    queryKey: authKeys.claimableMembers(userId ?? undefined),
    queryFn: () => getApi().auth.listClaimableMembers(),
    enabled: !!userId,
    retry: false,
  });
}

export function useUpdateMyMemberProfile(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; phoneNumber: string }) => {
      if (!userId) throw new Error('로그인이 필요합니다.');
      return getApi().auth.updateMyMemberProfile(input);
    },
    onSuccess: (member) => {
      queryClient.invalidateQueries({ queryKey: authKeys.profile(userId ?? undefined) });
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(member.id) });
    },
  });
}

export function useUnlinkMemberProfile(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('로그인이 필요합니다.');
      return getApi().auth.unlinkMyMember();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.profile(userId ?? undefined) });
      queryClient.invalidateQueries({ queryKey: authKeys.claimableMembers(userId ?? undefined) });
    },
  });
}
```

- [ ] **Step 4: AuthProvider 교체**

`src/providers/auth-provider.tsx` 전체를 아래로 교체:

```tsx
'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuthProfile } from '@/entities/auth/model/queries';
import { useMember } from '@/entities/member/model/queries';
import { getApi } from '@/shared/api/client';
import type { AuthUser } from '@/shared/api/ports/auth-repo';
import type { AppProfile } from '@/shared/types/auth';
import type { Member } from '@/shared/types/member';

interface AuthContextValue {
  user: AuthUser | null;
  profile: AppProfile | null;
  member: Member | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLinked: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const auth = getApi().auth;

    auth.getUser().then((currentUser) => {
      if (!isMounted) return;
      setUser(currentUser);
      setIsAuthLoading(false);
    });

    const unsubscribe = auth.onAuthStateChange((nextUser) => {
      setUser(nextUser);
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const profileQuery = useAuthProfile(user);
  const memberQuery = useMember(profileQuery.data?.member_id ?? '');

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile: profileQuery.data ?? null,
      member: memberQuery.data ?? null,
      isLoading: isAuthLoading || profileQuery.isLoading || memberQuery.isLoading,
      isAdmin: ['admin', 'superadmin'].includes(profileQuery.data?.role ?? ''),
      isSuperAdmin: profileQuery.data?.role === 'superadmin',
      isLinked: !!profileQuery.data?.member_id,
    }),
    [isAuthLoading, memberQuery.data, memberQuery.isLoading, profileQuery.data, profileQuery.isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
```

- [ ] **Step 5: 통과 확인**

Run: `pnpm test entities/auth`
Expected: 2 passed

- [ ] **Step 6: 커밋**

```bash
git add src/entities/auth src/providers/auth-provider.tsx
git commit -m "refactor(auth): move profile and linking queries onto the adapter and drop legacy RPC fallbacks"
```

---

### Task 15: 위젯/피처에 새어 나온 Supabase 직접 호출 제거 + 옛 `shared/api/supabase` 정리

**Files:**
- Modify: `src/widgets/login/ui/login-page-content.tsx:6-8,51,73-99`, `src/widgets/me/ui/my-page-content.tsx:24,77,91-93`, `src/features/member-create/ui/member-create-form.tsx:8,49`, `src/features/member-edit/ui/member-edit-form.tsx:8,49`
- Move: `src/shared/api/supabase/config.ts` → `src/shared/api/adapters/supabase/config.ts`, `src/shared/api/supabase/server.ts` → `src/shared/api/adapters/supabase/server.ts`
- Delete: `src/shared/api/supabase/storage.ts`, 디렉터리 `src/shared/api/supabase/`
- Modify: `src/app/auth/callback/route.ts:2`, `src/app/auth/confirm/route.ts:3`, `src/shared/api/adapters/supabase/create-api.ts:2` (import 경로)

**Interfaces:**
- Consumes: `getApi()`, `isLocalAdapter()` (Task 11)
- Produces: `src/shared/api/**` 밖에서 Supabase를 import하는 파일 0개. 확인 명령: `grep -rln "@/shared/api/supabase\|@supabase/" src --include='*.ts' --include='*.tsx' | grep -v "^src/shared/api/\|^src/app/auth/"` → 출력 없음.

- [ ] **Step 1: 로그인 페이지**

`src/widgets/login/ui/login-page-content.tsx`:
- 6행 `import type { Provider } from "@supabase/supabase-js";` 삭제, 8행을 `import { getApi } from "@/shared/api/client";`로 교체
- 51행 상태 타입을 `useState<"google" | "naver" | null>(null)`로
- 73~79행의 `supabase.auth.signInWithOAuth({...})` 블록을 아래로 교체:

```ts
    let data: { url: string | null };
    try {
      data = await getApi().auth.signInWithOAuth("google", redirectTo.toString());
    } catch (error) {
      const normalizedMessage = normalizeAuthErrorMessage(
        error instanceof Error ? error.message : "로그인 중 문제가 발생했습니다.",
      );
      setMessage(normalizedMessage);
      toast.error(normalizedMessage);
      setIsSubmitting(null);
      return;
    }
```

그리고 바로 뒤의 `if (error) { ... }` 블록(81~87행)은 삭제한다. `if (!data?.url)` 이하는 그대로 둔다. (로컬 어댑터는 `url: null`을 돌려주므로 "Google 로그인이 아직 올바르게 연결되지 않았습니다" 안내가 뜬다. 데모 로그인 버튼은 Task 16에서 추가한다.)

- [ ] **Step 2: 내 계정 페이지**

`src/widgets/me/ui/my-page-content.tsx`:
- 24행 `import { supabase } from "@/shared/api/supabase/config";` → `import { getApi } from "@/shared/api/client";`
- 77행 `const isLegacyClaimFlow = claimableMembers === null;` → `const isLegacyClaimFlow = false;` (Task 14에서 `useClaimableMembers`가 `Member[]`만 돌려주므로 레거시 분기는 죽은 코드가 된다. Phase 4에서 화면을 재작성할 때 분기째 삭제한다.)
- 92행 `await supabase.auth.signOut();` → `await getApi().auth.signOut();`

- [ ] **Step 3: 멤버 생성/수정 폼**

`src/features/member-create/ui/member-create-form.tsx`와 `src/features/member-edit/ui/member-edit-form.tsx` 각각:
- 8행 `import { uploadProfilePhoto } from "@/shared/api/supabase/storage";` → `import { getApi } from "@/shared/api/client";`
- 49행 `await uploadProfilePhoto(data.profile_photo, tempId)` / `await uploadProfilePhoto(data.profile_photo, member.id)` → `await getApi().members.uploadPhoto(data.profile_photo, tempId)` / `await getApi().members.uploadPhoto(data.profile_photo, member.id)`

- [ ] **Step 4: 옛 디렉터리 정리**

```bash
git mv src/shared/api/supabase/config.ts src/shared/api/adapters/supabase/config.ts
git mv src/shared/api/supabase/server.ts src/shared/api/adapters/supabase/server.ts
git rm src/shared/api/supabase/storage.ts
rmdir src/shared/api/supabase
```

- `src/shared/api/adapters/supabase/create-api.ts` 2행: `from '@/shared/api/supabase/config'` → `from '@/shared/api/adapters/supabase/config'` (이동한 `config.ts`의 `getSupabaseClient`를 그대로 쓴다)
- `src/app/auth/callback/route.ts` 2행, `src/app/auth/confirm/route.ts` 3행: `@/shared/api/supabase/server` → `@/shared/api/adapters/supabase/server`

- [ ] **Step 5: 검증**

Run: `pnpm type-check && pnpm lint && pnpm test`
Expected: 모두 exit 0. (Task 11 Step 6에서 남아 있던 타입 오류가 여기서 전부 사라진다.)

Run: `grep -rln "@/shared/api/supabase\|@supabase/" src --include='*.ts' --include='*.tsx' | grep -v "^src/shared/api/\|^src/app/auth/"`
Expected: 출력 없음

- [ ] **Step 6: 커밋**

```bash
git add -A src
git commit -m "refactor: remove direct supabase usage from widgets and features"
```

---

### Task 16: 로컬 모드 미들웨어 + 데모 로그인 + 역할 전환기

**Files:**
- Modify: `middleware.ts` (레포 루트)
- Create: `src/features/dev-session/ui/dev-role-switcher.tsx`, `src/features/dev-session/ui/demo-login-buttons.tsx`
- Modify: `src/app/layout.tsx`, `src/widgets/login/ui/login-page-content.tsx` (데모 버튼 삽입)
- Test: `middleware.test.ts` (레포 루트), `src/features/dev-session/ui/dev-role-switcher.test.tsx`

**Interfaces:**
- Consumes: `SESSION_COOKIE` (Task 4), `getApi`, `isLocalAdapter`, `resetLocalData` (Task 11), `DEMO_ACCOUNTS` (Task 2)
- Produces: `export function isAuthenticatedRequest(request: NextRequest): Promise<boolean>` (middleware.ts에서 export, 테스트용), `<DevRoleSwitcher />`, `<DemoLoginButtons nextPath />`

- [ ] **Step 1: 미들웨어 테스트 작성**

`middleware.test.ts` (레포 루트, vitest 기본 `include`가 루트 `*.test.ts`도 잡는다. `next/server`의 `NextRequest`는 Node의 `Request`가 필요하므로 이 파일만 node 환경으로 돌린다):

```ts
// @vitest-environment node
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

function request(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set('cookie', cookie);
  return new NextRequest(new URL(`http://localhost${path}`), { headers });
}

describe('middleware (local adapter)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DATA_ADAPTER = 'local';
  });

  it('세션 쿠키가 없으면 보호 라우트를 /login?next=로 보낸다', async () => {
    const res = await middleware(request('/dashboard'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/login?next=%2Fdashboard');
  });

  it('세션 쿠키가 있으면 통과한다', async () => {
    const res = await middleware(request('/dashboard', 'therun-session=u-member'));
    expect(res.status).toBe(200);
  });

  it('로그인 상태로 /login에 오면 /dashboard로 보낸다', async () => {
    const res = await middleware(request('/login', 'therun-session=u-member'));
    expect(res.headers.get('location')).toBe('http://localhost/dashboard');
  });

  it('공개 라우트는 쿠키 없이 통과한다', async () => {
    expect((await middleware(request('/'))).status).toBe(200);
    expect((await middleware(request('/club-guide'))).status).toBe(200);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test middleware.test`
Expected: FAIL — 첫 테스트가 Supabase에 접속하려다 실패하거나 `createServerClient` 인자 오류

- [ ] **Step 3: 미들웨어 구현**

`middleware.ts` 전체를 아래로 교체:

```ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const SESSION_COOKIE = 'therun-session';
const protectedRoutes = ['/dashboard', '/attendance', '/votes', '/matches', '/members', '/team-division', '/me', '/announcements', '/strategy'];
const authRoutes = ['/login'];

function matches(path: string, routes: string[]) {
  return routes.some((route) => path === route || path.startsWith(`${route}/`));
}

/** 로컬 어댑터는 데모 세션 쿠키만 본다. Supabase 어댑터는 SSR 클라이언트로 사용자를 확인한다. */
export async function isAuthenticatedRequest(request: NextRequest, response: NextResponse): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_DATA_ADAPTER !== 'supabase') {
    return Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  }

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  return Boolean(data.user);
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;
  const isAuthenticated = await isAuthenticatedRequest(request, response);

  if (!isAuthenticated && matches(path, protectedRoutes)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.search = '';
    redirectUrl.searchParams.set('next', path);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthenticated && matches(path, authRoutes)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

`/strategy`를 보호 목록에 추가한 것은 의도적이다 — 관리자 전용 화면인데 지금까지 비로그인 접근이 가능했다.

- [ ] **Step 4: 미들웨어 테스트 통과 확인**

Run: `pnpm test middleware.test`
Expected: 4 passed

- [ ] **Step 5: 역할 전환기 테스트 작성**

`src/features/dev-session/ui/dev-role-switcher.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DevRoleSwitcher } from '@/features/dev-session/ui/dev-role-switcher';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

const push = vi.fn();
const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));

describe('DevRoleSwitcher', () => {
  afterEach(() => {
    __setApiForTests(null);
    push.mockClear();
    refresh.mockClear();
  });

  it('계정 버튼을 누르면 데모 로그인 후 /dashboard로 이동한다', async () => {
    const { api, wrapper } = setupTestApi();
    render(<DevRoleSwitcher />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '관리자' }));
    expect((await api.auth.getUser())?.id).toBe('u-admin');
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('로그아웃 버튼은 세션을 지우고 /login으로 보낸다', async () => {
    const { api, wrapper } = setupTestApi();
    await api.auth.signInAsDemo('member');
    render(<DevRoleSwitcher />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(await api.auth.getUser()).toBeNull();
    expect(push).toHaveBeenCalledWith('/login');
  });
});
```

- [ ] **Step 6: 역할 전환기·데모 버튼 구현**

`src/features/dev-session/ui/dev-role-switcher.tsx`:

```tsx
'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getApi, resetLocalData } from '@/shared/api/client';
import { DEMO_ACCOUNTS, type DemoAccountKey } from '@/shared/api/ports/auth-repo';
import { cn } from '@/shared/lib/utils';

const ACCOUNT_KEYS: DemoAccountKey[] = ['member', 'admin', 'superadmin', 'unlinked'];

/** 로컬 어댑터 전용. 화면 우상단에 떠서 데모 계정을 바꾸거나 시드를 초기화한다. Supabase 모드에서는 렌더하지 않는다. */
export function DevRoleSwitcher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>, nextPath: string) => {
    setBusy(true);
    try {
      await action();
      queryClient.clear();
      router.push(nextPath);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="group"
      aria-label="데모 계정 전환"
      className="fixed right-2 top-2 z-[60] flex flex-wrap items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 p-1 text-[11px] shadow"
    >
      <span className="px-1 font-semibold text-amber-800">DEMO</span>
      {ACCOUNT_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          disabled={busy}
          onClick={() => run(async () => { await getApi().auth.signInAsDemo(key); }, '/dashboard')}
          className={cn('rounded px-1.5 py-0.5 hover:bg-amber-200', busy && 'opacity-50')}
        >
          {DEMO_ACCOUNTS[key].label}
        </button>
      ))}
      <button type="button" disabled={busy} onClick={() => run(() => getApi().auth.signOut(), '/login')} className="rounded px-1.5 py-0.5 hover:bg-amber-200">
        로그아웃
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => run(async () => { await getApi().auth.signOut(); await resetLocalData(); }, '/login')}
        className="rounded px-1.5 py-0.5 text-red-700 hover:bg-red-100"
      >
        데이터 초기화
      </button>
    </div>
  );
}
```

`src/features/dev-session/ui/demo-login-buttons.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { getApi } from '@/shared/api/client';
import { DEMO_ACCOUNTS, type DemoAccountKey } from '@/shared/api/ports/auth-repo';
import { Button } from '@/shared/ui/button';

const KEYS: DemoAccountKey[] = ['member', 'admin'];

/** 로컬 어댑터 전용 로그인 대체 수단. */
export function DemoLoginButtons({ nextPath }: { nextPath: string }) {
  const router = useRouter();

  const handleLogin = async (key: DemoAccountKey) => {
    await getApi().auth.signInAsDemo(key);
    router.push(nextPath);
    router.refresh();
  };

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4">
      <p className="text-sm font-medium">데모 모드 — 백엔드 없이 기기 안에서만 저장됩니다.</p>
      <div className="flex gap-2">
        {KEYS.map((key) => (
          <Button key={key} type="button" variant="outline" className="flex-1" onClick={() => handleLogin(key)}>
            {DEMO_ACCOUNTS[key].label}로 체험하기
          </Button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: 루트 레이아웃·로그인 페이지에 마운트**

`src/app/layout.tsx`:
- import 추가: `import { DevRoleSwitcher } from '@/features/dev-session/ui/dev-role-switcher';` 와 `import { isLocalAdapter } from '@/shared/api/client';`
- `<Toaster richColors position="top-center" />` 바로 위에 `{isLocalAdapter() && <DevRoleSwitcher />}` 추가

`src/widgets/login/ui/login-page-content.tsx`:
- import 추가: `import { DemoLoginButtons } from '@/features/dev-session/ui/demo-login-buttons';` 와 `import { isLocalAdapter } from '@/shared/api/client';`
- 반환 JSX의 `<div className="space-y-5">` 첫 자식(`<section ...>` 위)에 `{isLocalAdapter() && <DemoLoginButtons nextPath={nextPath} />}` 추가

(`widgets` → `features` import는 FSD 허용 방향이다.)

- [ ] **Step 8: 전체 검증 + 브라우저 확인**

Run: `pnpm test && pnpm type-check && pnpm lint`
Expected: 전부 exit 0

`.env.local`에 `NEXT_PUBLIC_DATA_ADAPTER=local` 추가 후 `pnpm dev` 실행. 브라우저에서:
1. `http://localhost:3000/dashboard` → `/login?next=%2Fdashboard`로 리다이렉트
2. "관리자로 체험하기" 클릭 → `/dashboard`가 시드 데이터(멤버명, 이번 주 경기 투표)로 렌더
3. 우상단 DEMO 바에서 "멤버" 클릭 → 대시보드가 멤버 모드로 바뀜, `/members` 링크가 내비에서 사라짐
4. `/votes`에 투표 3개 중 활성 2개가 보임, `/matches`에 경기 5개
5. "데이터 초기화" → `/login`으로 이동, 다시 로그인하면 시드가 복원됨

- [ ] **Step 9: 커밋**

```bash
git add middleware.ts middleware.test.ts src/features/dev-session src/app/layout.tsx src/widgets/login
git commit -m "feat: local-adapter middleware, demo login and dev role switcher"
```

---

### Task 17: ESLint 규칙 (FSD 경계 · 별칭 강제 · 로딩 마크업 경고) + 위반 정리

**Files:**
- Modify: `eslint.config.mjs`
- Modify (상대 import → 별칭, 13곳): `src/app/apple-icon.tsx:1`, `src/app/twitter-image.tsx:1`, `src/features/account-member-edit/ui/account-member-edit-form.tsx:15`, `src/features/member-edit/ui/member-edit-form.tsx:9`, `src/features/team-split-manual/ui/team-split-manual.tsx:9`, `src/features/member-create/ui/member-create-form.tsx:9`, `src/features/announcement-create/ui/announcement-create-form.tsx:10`, `src/features/vote-create/ui/vote-create-form.tsx:7`, `src/features/match-schedule/ui/match-schedule-card.tsx:7`, `src/widgets/home/ui/home-page-content.tsx:14`, `src/widgets/members-list/ui/members-list.tsx:9`, `src/entities/member/ui/member-card.tsx:8` (+ `src/shared/api/supabase/storage.ts:1`은 Task 15에서 이미 삭제됨)
- Modify (entities→features 위반 1곳): `src/entities/vote/ui/vote-card.tsx`, `src/widgets/votes/ui/votes-list.tsx`

**Interfaces:**
- Produces: `pnpm lint` exit 0 (warn만 허용). 경계 규칙 위반은 error.

- [ ] **Step 1: ESLint 설정 교체**

`eslint.config.mjs` 전체를 아래로 교체:

```js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

/** FSD 상향 import 차단. 각 레이어가 import하면 안 되는 상위 레이어 패턴. */
const upward = (...layers) => layers.map((layer) => ({ group: [`@/${layer}/*`], message: `${layer}는 상위 레이어입니다. FSD 방향(shared→entities→features→widgets→app)을 지키세요.` }));

const relativeImportBan = { group: ['./*', '../*'], message: '상대 경로 대신 @/ 별칭을 쓰세요.' };
const adapterBan = { group: ['@/shared/api/adapters/*', '@/shared/api/supabase/*'], message: '어댑터를 직접 import하지 마세요. @/shared/api/client의 getApi()를 쓰세요.' };

export default [
  { ignores: ['node_modules/**', '.next/**', 'out/**', 'coverage/**', 'playwright-report/**', 'test-results/**'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: ['src/**/*.{ts,tsx}', 'middleware.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [relativeImportBan, adapterBan] }],
      // Phase 2에서 공용 Skeleton 도입 후 'error'로 승격한다.
      'no-restricted-syntax': [
        'warn',
        { selector: "JSXAttribute[name.name='className'] Literal[value=/animate-pulse/]", message: '로딩 UI는 공용 Skeleton만 씁니다. animate-pulse 직접 마크업 금지.' },
        { selector: "JSXAttribute[name.name='className'] TemplateLiteral[quasis.0.value.raw=/animate-pulse/]", message: '로딩 UI는 공용 Skeleton만 씁니다. animate-pulse 직접 마크업 금지.' },
        { selector: 'JSXText[value=/로딩 중|불러오는 중/]', message: '로딩 텍스트 대신 공용 Skeleton을 씁니다.' },
      ],
    },
  },
  { files: ['src/shared/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': ['error', { patterns: [relativeImportBan, ...upward('entities', 'features', 'widgets', 'app')] }] } },
  { files: ['src/shared/api/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': ['error', { patterns: [relativeImportBan, ...upward('entities', 'features', 'widgets', 'app')] }] } },
  { files: ['src/entities/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': ['error', { patterns: [relativeImportBan, adapterBan, ...upward('features', 'widgets', 'app')] }] } },
  { files: ['src/features/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': ['error', { patterns: [relativeImportBan, adapterBan, ...upward('widgets', 'app')] }] } },
  { files: ['src/widgets/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': ['error', { patterns: [relativeImportBan, adapterBan, ...upward('app')] }] } },
  // 테스트 헬퍼는 어댑터를 직접 꽂아야 한다.
  { files: ['src/**/*.test.{ts,tsx}', 'src/shared/lib/test/**/*.{ts,tsx}', 'middleware.test.ts'], rules: { 'no-restricted-imports': ['error', { patterns: [relativeImportBan] }] } },
];
```

주의: `src/shared/api/**` 블록이 `src/shared/**` 블록보다 뒤에 와서 어댑터 내부는 `adapterBan` 없이 서로 import할 수 있다(flat config는 뒤 블록이 이긴다). `middleware.ts`의 `@supabase/ssr` import는 패키지라 규칙에 안 걸린다.

- [ ] **Step 2: 린트 실행해 위반 목록 확인**

Run: `pnpm lint`
Expected: error 13건(상대 import 12곳 + `vote-card.tsx`의 `@/features/...`), warn 11건(animate-pulse 2 + 로딩 텍스트 9)

- [ ] **Step 3: 상대 import 12곳을 별칭으로 교체**

각 파일에서 `../model/schema` → `@/features/<feature>/model/schema`, `./x` → 같은 디렉터리의 절대 경로. 예:
- `src/app/apple-icon.tsx`: `from "./icon"` → `from "@/app/icon"`
- `src/app/twitter-image.tsx`: `from "./opengraph-image"` → `from "@/app/opengraph-image"`
- `src/features/member-edit/ui/member-edit-form.tsx`: `from "../model/schema"` → `from "@/features/member-edit/model/schema"`
- `src/features/team-split-manual/ui/team-split-manual.tsx`: `from './member-context-menu'` → `from '@/features/team-split-manual/ui/member-context-menu'`
- `src/features/match-schedule/ui/match-schedule-card.tsx`: `from "./match-game-card-enhanced"` → `from "@/features/match-schedule/ui/match-game-card-enhanced"`
- `src/widgets/home/ui/home-page-content.tsx`: `from "./mobile-landing-carousel"` → `from "@/widgets/home/ui/mobile-landing-carousel"`
- `src/widgets/members-list/ui/members-list.tsx`: `from "./role-management-panel"` → `from "@/widgets/members-list/ui/role-management-panel"`
- `src/entities/member/ui/member-card.tsx`: `from "./member-avatar"` → `from "@/entities/member/ui/member-avatar"`
- 나머지(account-member-edit, member-create, announcement-create, vote-create)도 `@/features/<feature>/model/schema`

- [ ] **Step 4: `vote-card`의 features 의존 제거 (actions 슬롯)**

`src/entities/vote/ui/vote-card.tsx`:
- 17행 `import { VoteDeleteButton } ...` 삭제, 18행 `useAuth` import 삭제
- 3행을 `import { useMemo, type ReactNode } from "react";`로
- props를 `interface VoteCardProps { session: VoteSession; onVoteClick: () => void; actions?: ReactNode; }`로, 컴포넌트 시그니처를 `export function VoteCard({ session, onVoteClick, actions }: VoteCardProps)`로
- 42행 `const { isAdmin } = useAuth();` 삭제
- 81~86행 `{isAdmin && (<VoteDeleteButton .../>)}` → `{actions}`

`src/widgets/votes/ui/votes-list.tsx`:
- import 추가: `import { VoteDeleteButton } from "@/features/vote-delete/ui/vote-delete-button";`
- 두 `<VoteCard key={session.id} session={session} onVoteClick={...} />` (matchVotes / otherVotes)에 아래 prop 추가:

```tsx
                    actions={
                      isAdmin ? (
                        <VoteDeleteButton sessionId={session.id} sessionTitle={session.title} />
                      ) : undefined
                    }
```

- [ ] **Step 5: 검증**

Run: `pnpm lint`
Expected: 0 errors, 11 warnings

Run: `pnpm type-check && pnpm test && pnpm build`
Expected: 전부 exit 0

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "chore(lint): enforce FSD boundaries and alias imports, warn on ad-hoc loading markup"
```

---

### Task 18: Playwright 스캐폴드 + 로컬 어댑터 스모크 E2E

**Files:**
- Create: `playwright.config.ts`, `e2e/_setup/auth.setup.ts`, `e2e/smoke/local-adapter.spec.ts`
- Modify: `package.json` (`e2e` 스크립트는 Task 1에서 추가됨)

**Interfaces:**
- Consumes: 로그인 페이지의 "멤버로 체험하기 / 관리자로 체험하기" 버튼(Task 16), 세션 localStorage+쿠키(Task 4)
- Produces: `pnpm e2e` — 프로젝트 `setup` → `mobile`(iPhone 13, 390×844) + `desktop`(Desktop Chrome). storageState `e2e/.auth/member.json`, `e2e/.auth/admin.json`

- [ ] **Step 1: 설치**

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

- [ ] **Step 2: 설정**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

export const STORAGE_DIR = path.join(__dirname, 'e2e/.auth');

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    locale: 'ko-KR',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: { NEXT_PUBLIC_DATA_ADAPTER: 'local' },
    timeout: 120_000,
  },
  projects: [
    { name: 'setup', testMatch: /_setup\/.*\.setup\.ts/ },
    { name: 'mobile', testMatch: /.*\.spec\.ts/, dependencies: ['setup'], use: { ...devices['iPhone 13'] } },
    { name: 'desktop', testMatch: /.*\.spec\.ts/, dependencies: ['setup'], use: { ...devices['Desktop Chrome'] } },
  ],
});
```

- [ ] **Step 3: 인증 setup**

`e2e/_setup/auth.setup.ts`:

```ts
import { test as setup, expect } from '@playwright/test';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

const ACCOUNTS = [
  { file: 'member.json', button: '멤버로 체험하기' },
  { file: 'admin.json', button: '관리자로 체험하기' },
] as const;

for (const account of ACCOUNTS) {
  setup(`데모 로그인 저장: ${account.file}`, async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: account.button }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.context().storageState({ path: path.join(STORAGE_DIR, account.file) });
  });
}
```

(e2e 디렉터리는 ESLint의 `src/**` 규칙 밖이라 상대 import가 허용된다.)

- [ ] **Step 4: 스모크 스펙**

`e2e/smoke/local-adapter.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { STORAGE_DIR } from '../../playwright.config';

test.describe('로컬 어댑터 스모크 — 멤버', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'member.json') });

  test('로그인 상태로 대시보드·투표·경기가 시드로 렌더된다', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/votes');
    await expect(page.getByText('정기 경기').first()).toBeVisible();
    await expect(page.getByText('경기 후 회식')).toBeVisible();

    await page.goto('/matches');
    await expect(page.getByText('더런 풋살장').first()).toBeVisible();
  });

  test('비로그인 컨텍스트는 /login으로 보낸다', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
    await context.close();
  });
});

test.describe('로컬 어댑터 스모크 — 관리자', () => {
  test.use({ storageState: path.join(STORAGE_DIR, 'admin.json') });

  test('멤버 디렉토리에 시드 20명이 보인다', async ({ page }) => {
    await page.goto('/members');
    await expect(page.getByText('김민준').first()).toBeVisible();
    await expect(page.getByText('홍유준').first()).toBeVisible();
  });
});
```

- [ ] **Step 5: 실행**

Run: `pnpm e2e`
Expected: setup 2 passed, mobile 3 passed, desktop 3 passed. 실패하면 `playwright-report/index.html`의 스크린샷으로 실제 텍스트를 확인해 셀렉터를 맞춘다(시드 텍스트는 Task 5 그대로).

- [ ] **Step 6: 커밋**

```bash
git add playwright.config.ts e2e package.json pnpm-lock.yaml
git commit -m "test(e2e): add Playwright scaffold and local-adapter smoke tests"
```

---

### Task 19: GitHub Actions CI + Sentry 배선

**Files:**
- Create: `.github/workflows/ci.yml`, `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`
- Modify: `next.config.ts`, `.env.local.example`

- [ ] **Step 1: CI 워크플로**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened, ready_for_review]
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    if: github.event_name != 'pull_request' || github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    env:
      NEXT_PUBLIC_DATA_ADAPTER: local
      NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ci-placeholder
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test
      - run: pnpm build
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm e2e
        env:
          CI: true
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report
          retention-days: 7
```

- [ ] **Step 2: Sentry 배선 (DSN 없으면 no-op)**

```bash
pnpm add @sentry/nextjs
```

`sentry.client.config.ts`:

```ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
  tracesSampleRate: 0.1,
});
```

`sentry.server.config.ts`와 `sentry.edge.config.ts` (내용 동일):

```ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
  tracesSampleRate: 0.1,
});
```

`src/instrumentation.ts`:

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('../sentry.server.config');
  if (process.env.NEXT_RUNTIME === 'edge') await import('../sentry.edge.config');
}

export { captureRequestError as onRequestError } from '@sentry/nextjs';
```

(이 파일은 `src/` 밖의 루트 설정을 가리키므로 상대 경로가 불가피하다. ESLint 규칙에서 제외하기 위해 `eslint.config.mjs`의 첫 블록 `ignores`에 `'src/instrumentation.ts'`를 추가한다.)

`next.config.ts`:

```ts
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
};

// SENTRY_AUTH_TOKEN이 없으면 소스맵 업로드는 건너뛴다(빌드는 성공).
export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  widenClientFileUpload: true,
});
```

`.env.local.example` 전체를 아래로 교체:

```env
# 데이터 어댑터: local(기본, IndexedDB + 시드) | supabase
NEXT_PUBLIC_DATA_ADAPTER=local

# Supabase (NEXT_PUBLIC_DATA_ADAPTER=supabase일 때만 사용)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Sentry (비우면 비활성)
NEXT_PUBLIC_SENTRY_DSN=

# Optional: direct Postgres connection string for one-off migration scripts
# SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

- [ ] **Step 3: 검증**

Run: `pnpm build && pnpm lint && pnpm type-check`
Expected: exit 0. 빌드 로그에 Sentry 소스맵 업로드 경고가 있어도 실패는 아니어야 한다.

Run: `pnpm dev` 후 `/dashboard` 접속 → 콘솔에 Sentry 관련 오류 없음.

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "ci: add GitHub Actions pipeline and wire Sentry behind an optional DSN"
```

---

### Task 20: 문서 — README · CLAUDE.md · Supabase 복귀 문서

**Files:**
- Modify: `README.md`, `CLAUDE.md`
- Create: `docs/supabase-reconnect.md`

- [ ] **Step 1: README 재작성**

`README.md` 전체를 아래로 교체 (전면 개편 후 Phase 6에서 다시 다듬는다):

```markdown
# The Run — 풋살 클럽 운영 앱

The Run 축구 동호회를 위한 모바일 중심 웹 앱. 투표 → 팀 나누기 → 경기 기록 → 공지의 주간 루프를 한 곳에서 돌린다.

> 지금은 **전면 개편 중**이다. 설계: `docs/superpowers/specs/2026-09-03-therun-overhaul-design.md`, 진행 계획: `docs/superpowers/plans/`.

## 빠르게 실행하기

```bash
pnpm install
cp .env.local.example .env.local   # 기본값이 데모(local) 모드
pnpm dev                            # http://localhost:3000
```

로그인 화면의 **"멤버로 체험하기 / 관리자로 체험하기"**로 들어간다. 우상단 DEMO 바에서 계정을 바꾸거나(멤버·관리자·슈퍼관리자·미연결) **데이터 초기화**로 시드를 되돌린다.

## 데이터 어댑터

| `NEXT_PUBLIC_DATA_ADAPTER` | 저장소 | 인증 | 용도 |
|---|---|---|---|
| `local` (기본) | 브라우저 IndexedDB + 시드(멤버 20·투표 3·경기 5·공지 4) | 데모 계정 4개 | 개발·데모·테스트. 기기별 저장, 멤버 간 공유 없음 |
| `supabase` | Supabase Postgres | Google OAuth / 이메일 | 실사용. 복귀 절차는 `docs/supabase-reconnect.md` |

코드는 `src/shared/api/client.ts`의 `getApi()`만 호출한다. 어댑터는 `src/shared/api/adapters/{collection,supabase}`에 있고 같은 포트(`src/shared/api/ports`)를 구현한다.

## 명령어

```bash
pnpm dev          # 개발 서버
pnpm build        # 프로덕션 빌드
pnpm lint         # ESLint (FSD 경계·별칭 강제)
pnpm type-check   # tsc --noEmit
pnpm test         # vitest (유닛·훅·어댑터 계약)
pnpm e2e          # Playwright (setup → iPhone 13 + Desktop Chrome)
```

CI(`.github/workflows/ci.yml`)가 PR마다 위 전부를 돌린다.

## 기술 스택

Next.js 15 · React 19 · TypeScript · Tailwind + shadcn/ui · TanStack Query · Zustand · React Hook Form + Zod · idb-keyval · Supabase(복귀 예정) · vitest · Playwright · Sentry(선택)

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
```

- [ ] **Step 2: CLAUDE.md 갱신**

`CLAUDE.md`의 다음 부분을 수정:
- "Development Commands" 코드 블록을 README의 "명령어" 블록 내용(pnpm 기준)으로 교체
- "### 5. Supabase Integration" 섹션 제목을 "### 5. Data Access (ports/adapters)"로 바꾸고 본문을 아래로 교체:

```markdown
- 모든 데이터 접근은 `getApi()` (`src/shared/api/client.ts`) 하나로 들어간다. 포트: `src/shared/api/ports/`. 어댑터: `src/shared/api/adapters/collection/`(IndexedDB/메모리 + 시드), `src/shared/api/adapters/supabase/`.
- `entities/*/model/queries.ts`는 `getApi().<domain>.<method>()`만 호출한다. 위젯/피처에서 어댑터나 Supabase를 직접 import하면 ESLint error.
- 출석(attendance)은 별도 도메인이 아니라 `type: 'match'` 투표다. `entities/attendance`는 매핑 계층이며 Phase 3에서 삭제 예정.
- 인증 사용자 타입은 `AuthUser { id, email }` (`@/shared/api/ports/auth-repo`). Supabase `User`를 직접 쓰지 않는다.
- 로컬 모드 세션: localStorage `therun:session` + 쿠키 `therun-session`. 미들웨어는 쿠키만 본다.
- 테스트에서는 `setupTestApi()` (`src/shared/lib/test/query-wrapper.tsx`)로 메모리 어댑터를 꽂는다. 어댑터 계약 테스트는 `src/shared/api/adapters/contracts/`.
```

- "Environment Variables" 섹션을 `.env.local.example` 내용으로 교체
- "Common Pitfalls"에 추가: `7. **Adapter access:** getApi() 밖에서 어댑터를 import하지 말 것. 새 데이터 기능은 포트에 메서드를 추가하고 두 어댑터 + 계약 테스트를 함께 갱신할 것.`

- [ ] **Step 3: Supabase 복귀 문서**

`docs/supabase-reconnect.md`:

```markdown
# Supabase 복귀 절차

로컬 어댑터로 운영하다가 Supabase로 돌아갈 때의 체크리스트.

## 1. 프로젝트·스키마
1. Supabase 프로젝트 생성 후 SQL Editor에서 순서대로 적용: `supabase/migrations/complete_schema.sql` → `20260108_add_match_status_fields.sql` → `20260311_add_app_profiles.sql` → `20260311_harden_rls.sql` → `20260312_add_announcements.sql` → `20260312_mask_member_numbers_and_enable_self_member_updates.sql` → `20260314_add_superadmin_role.sql` → `20260316_add_superadmin_role_management.sql`
2. `20260313_promote_all_social_users_to_admin.sql`은 적용하지 않는다(문법 오류가 있고 정책상도 부적절).
3. 출석 테이블 병합: `attendance_sessions`/`attendance_votes`는 더 이상 코드가 읽지 않는다. 데이터가 필요하면 `vote_sessions(type='match')`/`vote_responses`로 옮기는 마이그레이션을 새로 작성한다.
4. `member-photos` 스토리지 버킷 생성(public read).
5. Authentication > Providers > Google 활성화, redirect URI = `https://<도메인>/auth/callback`.

## 2. 코드 계약 확인
- 어댑터는 현행 RPC 계약만 지원한다: `link_my_member(target_member_id)`, `unlink_my_member()`, `get_claimable_members()`, `set_app_profile_role(target_profile_id, next_role)`, `update_my_member_profile(input_name, input_phone)`.
- `src/shared/api/adapters/contracts/*.contract.ts`를 Supabase 어댑터로 돌려 계약을 검증한다. 테스트 픽스처는 서비스 롤 키로 테스트 사용자 생성·정리를 해야 한다(작성 필요).
- 로컬에서 먼저 검증하려면 Docker + `supabase start`로 로컬 스택을 띄우고 위 마이그레이션을 적용한다.

## 3. 전환
- `.env.local` / Vercel 환경변수: `NEXT_PUBLIC_DATA_ADAPTER=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- 첫 관리자: 로그인 한 번 → `update public.app_profiles set role = 'superadmin' where email = '<이메일>';`
- 데모 로그인 버튼과 DEMO 바는 `isLocalAdapter()`가 false가 되면서 자동으로 사라진다.
```

- [ ] **Step 4: 최종 검증 + 커밋 + PR**

Run: `pnpm lint && pnpm type-check && pnpm test && pnpm build && pnpm e2e`
Expected: 전부 exit 0

```bash
git add README.md CLAUDE.md docs/supabase-reconnect.md
git commit -m "docs: describe the adapter-based setup, demo mode and Supabase reconnect steps"
git push -u origin overhaul/01-data-layer
gh pr create --base main --title "Phase 0: adapter-based data layer, demo mode and quality infra" --body "$(cat <<'PRBODY'
## Summary
- 포트/어댑터 데이터 계층: `getApi()` 하나로 collection(IndexedDB+시드) ↔ supabase 전환
- 로컬 모드 미들웨어 · 데모 로그인 · 역할 전환기 (Supabase 없이 앱이 뜸)
- 출석을 `type: 'match'` 투표 위의 매핑으로 흡수
- vitest(어댑터 계약·훅) · Playwright 스모크 · ESLint FSD 경계 · GitHub Actions · Sentry 배선
- README / CLAUDE.md / Supabase 복귀 문서

Spec: docs/superpowers/specs/2026-09-03-therun-overhaul-design.md
Plan: docs/superpowers/plans/2026-09-03-phase0-data-layer-and-infra.md

## Vercel 설정 필요
프로젝트 환경변수에 `NEXT_PUBLIC_DATA_ADAPTER=local` 추가.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01KmFjsGdekc4EvomPPHMzAq
PRBODY
)"
```

---

## 완료 기준 (Phase 0 done)

- `pnpm dev`가 `.env.local`에 Supabase 값 없이 뜨고, 데모 로그인으로 19개 라우트 전부 시드 데이터로 렌더된다
- `pnpm lint && pnpm type-check && pnpm test && pnpm build && pnpm e2e` 전부 green, CI도 green
- `src/shared/api/**` 밖에서 Supabase/어댑터 직접 import 0건
- `NEXT_PUBLIC_DATA_ADAPTER=supabase`로도 `pnpm build`가 성공한다(런타임 검증은 복귀 시)
