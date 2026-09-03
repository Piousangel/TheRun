# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Run is a mobile-first futsal club management system built with Next.js 15 + React 19. The codebase uses FSD (Feature-Sliced Design) architecture with TanStack Query for server state, Zustand for client state, and a port/adapter data layer (local IndexedDB by default, Supabase optional — see "Data Access" below).

**Product decisions override the approved spec.** `docs/product-decisions.md` records owner decisions made after the spec was approved; on conflict, that document wins. Two that anyone touching this code must know: **team splits persist to the server** (D-04, reverses spec §4 #4 — a confirmed split becomes a `status: 'pending'` Match), and **the member phone number is being removed from the domain** (D-03 — it's still in the code today, but treat it as scheduled for deletion, not something to build on).

## Development Commands

```bash
pnpm dev          # Development server (localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint (enforces FSD boundaries + @/ aliases)
pnpm type-check   # tsc --noEmit
pnpm test         # vitest (unit/hooks/adapter contracts)
pnpm e2e          # Playwright (setup → mobile: iPhone 13/webkit + desktop: Desktop Chrome)
```

## Architecture: Feature-Sliced Design (FSD)

The codebase follows strict FSD layering with unidirectional dependencies:

```
src/
├── app/              # Next.js 15 App Router (routes + layouts)
├── shared/           # Cross-cutting concerns (UI components, API client, types, utils)
├── entities/         # Domain layer (member, match, attendance, vote, field)
├── features/         # Feature layer (create, edit, delete, vote, team-split, tactical-board)
├── widgets/          # Composite layer (page-level components)
└── providers/        # React Context providers
```

**Dependency Rules:**
- Entities can be imported by features and widgets
- Features can be imported by widgets
- Never import upward or create circular dependencies
- Always use `@/*` path aliases, never relative imports

## Key Architectural Patterns

### 1. Query Pattern (TanStack Query + Supabase)

All data fetching uses custom hooks in `entities/{domain}/model/queries.ts`:

```typescript
// Query key factory pattern for hierarchical cache invalidation
export const memberKeys = {
  all: ['members'] as const,
  lists: () => [...memberKeys.all, 'list'] as const,
  list: (filters?: string) => [...memberKeys.lists(), { filters }] as const,
  details: () => [...memberKeys.all, 'detail'] as const,
  detail: (id: string) => [...memberKeys.details(), id] as const,
};

// Query hooks
export function useMembers() {
  return useQuery({
    queryKey: memberKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase.from('members').select('*');
      if (error) throw error;
      return data;
    },
  });
}

// Mutation hooks with automatic cache invalidation
export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => { /* ... */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}
```

**Important:** Always use query key factories for cache management.

### 2. State Management Strategy

**Server State (TanStack Query):** Remote data (members, matches, votes, attendance)
- Configuration in `/src/providers/query-provider.tsx`
- 1-minute stale time, no refetch on window focus

**Client State (Zustand):** Transient UI state
- **With persistence:** Team split store (`/src/features/team-split-manual/model/store.ts`) uses `persist` middleware
- **Without persistence:** Tactical board store (`/src/features/tactical-board/model/store.ts`) is session-only

### 3. Form Pattern (React Hook Form + Zod)

All forms follow this structure:

```
features/{feature}/
├── model/
│   └── schema.ts      # Zod schema definition
└── ui/
    └── {feature}-form.tsx  # Form component with useForm + zodResolver
```

Example:
```typescript
// Schema
export const memberCreateSchema = z.object({
  name: z.string().min(1).max(100),
  phone_number: z.string().regex(/^010-\d{4}-\d{4}$/),
  stats: z.object({ speed: z.number().min(0).max(100), /* ... */ }),
});

// Form component
const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
  resolver: zodResolver(memberCreateSchema),
  defaultValues: { /* ... */ },
});
```

Use `register` for inputs, `watch` for reactive values, `setValue` for programmatic updates.

### 4. Dynamic Routes (Next.js 15)

Routes use async params:

```typescript
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <Widget id={id} />;
}
```

### 5. Data Access (ports/adapters)

- 모든 데이터 접근은 `getApi()` (`src/shared/api/client.ts`) 하나로 들어간다. 포트: `src/shared/api/ports/`. 어댑터: `src/shared/api/adapters/collection/`(IndexedDB/메모리 + 시드), `src/shared/api/adapters/supabase/`.
- `entities/*/model/queries.ts`는 `getApi().<domain>.<method>()`만 호출한다. 위젯/피처에서 어댑터나 Supabase를 직접 import하면 ESLint error.
- 출석(attendance)은 별도 도메인이 아니라 `type: 'match'` 투표다. `entities/attendance`는 매핑 계층이며 Phase 3에서 삭제 예정.
- 인증 사용자 타입은 `AuthUser { id, email }` (`@/shared/api/ports/auth-repo`). Supabase `User`를 직접 쓰지 않는다.
- 로컬 모드 세션: localStorage `therun:session` + 쿠키 `therun-session`. 미들웨어는 쿠키만 본다. 로컬 세션의 읽기 원천은 쿠키로 통일돼 있고 localStorage는 미러링만 한다.
- 테스트에서는 `setupTestApi()` (`src/shared/lib/test/query-wrapper.tsx`)로 메모리 어댑터를 꽂는다. 어댑터 계약 테스트는 `src/shared/api/adapters/contracts/`.

## Domain Models

### Core Entities

**Member:**
```typescript
interface Member {
  id: string;
  name: string;
  phone_number: string;  // 010-1234-5678 format
  profile_photo: string | null;
  stats: MemberStats;    // speed, shooting, passing, dribbling, stamina, defense (0-100)
}
```

**Match:**
```typescript
interface Match {
  id: string;
  date: string;
  location: string;
  team_a: TeamMatchData;
  team_b: TeamMatchData;
  status: 'pending' | 'in_progress' | 'finished';
  vote_session_id?: string;
  match_number?: number;
  start_time?: string;   // For timer persistence
  duration?: number;     // Total duration in seconds
}

interface TeamMatchData {
  name: string;
  member_ids: string[];
  score: number;
  goalkeeper_id?: string;
  manager_id?: string;
  substitutions: SubstitutionRecord[];
  goals_detail: GoalRecord[];
}
```

**Vote & Attendance:**
```typescript
interface VoteSession {
  id: string;
  title: string;
  type: 'match' | 'dining' | 'outing' | 'other';
  event_date: string;
  deadline: string;
  is_active: boolean;
}

interface VoteResponse {
  session_id: string;
  member_id: string;
  status: 'attending' | 'absent';
}
```

## Critical Implementation Details

### Auto-Balance Algorithm

Location: `/src/features/team-split-auto/model/algorithm.ts`

```typescript
export function autoBalanceTeams(members: Member[]): { teamA: Member[]; teamB: Member[] }
export function calculateMemberTotalStats(stats: MemberStats): number
```

Sorts by total stats, alternates strongest players, balances team totals.

### Match Timer Persistence

Location: `/src/widgets/match-detail/ui/match-detail-widget.tsx`

Timer continues across page reloads by storing `start_time` and `duration` in database:

```typescript
// On start: save start_time to match
// On reload: calculate elapsed time, restore remaining time, auto-resume
const elapsed = (Date.now() - new Date(match.start_time).getTime()) / 1000;
const remaining = Math.max(0, match.duration - elapsed);
```

### Tactical Board Pattern

Location: `/src/features/tactical-board/`

- Uses 10 fixed position slots regardless of player count (6v6, 7v7, 8v8)
- Drag functionality disabled; uses position change menu instead
- Substitutes placed on bench area
- Store: session-only (no persistence)

### Team Split Store Persistence

Location: `/src/features/team-split-manual/model/store.ts`

Uses Zustand `persist` middleware with localStorage key `team-split-storage`. State survives page refresh.

## Code Conventions

### Component Architecture

**Required:**
- Components directly call hooks (never pass hooks as props)
- Handler functions declared inside components (not extracted to separate files)

**Forbidden:**
- Passing handlers as props
- Re-processing data and passing to grandchildren

### File Structure Within Features

```
features/{feature}/
├── model/
│   ├── schema.ts     # Zod schemas
│   ├── store.ts      # Zustand stores (if needed)
│   └── algorithm.ts  # Business logic (if needed)
└── ui/
    ├── {feature}-form.tsx
    ├── {feature}-button.tsx
    └── {component}.tsx
```

### Naming Conventions

- **Features:** `{feature}-form.tsx`, `{feature}-button.tsx`
- **Widgets:** `{domain}-widget.tsx`, `{domain}-list.tsx`
- **Entities:** `{domain}-card.tsx`, `{domain}-avatar.tsx`

### Import Paths

Always use `@/*` path alias:
```typescript
import { useMembers } from '@/entities/member/model/queries';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
```

## Database Schema

All tables follow this pattern:

```sql
CREATE TABLE {entity} (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  {domain-fields},
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE {entity} ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON {entity} FOR ALL USING (true);
```

Key tables: `members`, `matches`, `attendance_sessions`, `attendance_votes`, `vote_sessions`

Storage bucket: `member-photos` — **public read로 만들지 않는다**, 인증된 사용자만 읽을 수 있는 정책으로 만든다(재연결 차단 항목, `docs/supabase-reconnect.md` §0 참고)

## Environment Variables

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

## Localization

Currently Korean-first with i18n infrastructure:

- Date formatting uses `date-fns` with `ko` locale
- Constants: `/src/shared/lib/constants.ts` (POSITION_ROLE_LABELS, STAT_LABELS)
- Phone validation: `010-\d{4}-\d{4}` format (Korean mobile numbers)

## Technology Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| Framework | Next.js 15 | React SSR + App Router |
| UI | React 19 | UI library |
| Language | TypeScript 5.7 | Type safety |
| Server State | TanStack Query 5 | Data fetching + caching |
| Client State | Zustand 5 | Lightweight state |
| Forms | React Hook Form + Zod | Form validation |
| Database | Supabase | PostgreSQL + Storage |
| UI Components | shadcn/ui | Headless components |
| Styling | Tailwind CSS | Utility-first CSS |
| Charts | Recharts | React charts |
| Drag & Drop | @dnd-kit | DnD interactions |

## Mobile-First Design

- Bottom navigation bar (visible on mobile, hidden on `md+` breakpoint)
- Touch-optimized (minimum 44x44px touch targets)
- Responsive grid layouts
- Padding adjustments: `pb-16 md:pb-0` for bottom nav clearance

## Common Pitfalls

1. **Cache Invalidation:** Always use query key factories; don't manually construct keys
2. **Phone Validation:** Must match `^010-\d{4}-\d{4}$` format
3. **Dynamic Routes:** Remember to await params in Next.js 15: `const { id } = await params;`
4. **File Uploads:** Upload to storage BEFORE creating database record
5. **Match Timer:** Use database timestamps, not local state, for persistence
6. **FSD Dependencies:** Never import from higher layers (e.g., features importing from widgets)
7. **Adapter access:** getApi() 밖에서 어댑터를 import하지 말 것. 새 데이터 기능은 포트에 메서드를 추가하고 두 어댑터 + 계약 테스트를 함께 갱신할 것.
8. **Middleware location:** 미들웨어는 반드시 `src/middleware.ts`에 둘 것. `src/` 레이아웃을 쓰는 Next.js 프로젝트는 레포 루트의 `middleware.ts`를 로드하지 않는다 — 이 프로젝트에서 실제로 이 결함이 있었고, 그 결과 보호 라우트가 무방비로 노출됐었다.
