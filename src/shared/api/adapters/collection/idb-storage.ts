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
