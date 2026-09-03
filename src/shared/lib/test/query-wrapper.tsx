import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { JSX, ReactNode } from 'react';
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
