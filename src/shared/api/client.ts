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
