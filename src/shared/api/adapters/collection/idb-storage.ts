import { clear, createStore, get, set } from 'idb-keyval';
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
    await clear(this.store);
  }
}

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  const hit = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!hit) return null;
  const raw = hit.slice(prefix.length);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * 세션의 진실 원천은 **쿠키**다 — 미들웨어가 실제로 게이트하는 값이 그것이기 때문이다.
 * localStorage에도 같은 값을 쓰지만(Phase 0 스펙에 기록된 키) 읽지는 않는다.
 * 쿠키만 읽으면 "쿠키 만료 후 앱만 로그인 상태" / "localStorage만 지워 리다이렉트 루프" 두 증상이 모두 사라진다.
 */
export class BrowserSessionStore implements SessionStore {
  get(): string | null {
    if (typeof document === 'undefined') return null;
    return readCookie(SESSION_COOKIE);
  }

  set(userId: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(userId)}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
    window.localStorage?.setItem(SESSION_STORAGE_KEY, userId);
  }

  clear(): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
    window.localStorage?.removeItem(SESSION_STORAGE_KEY);
  }
}
