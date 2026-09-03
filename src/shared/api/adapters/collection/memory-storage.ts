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
