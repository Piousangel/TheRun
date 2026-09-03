import { Collection } from '@/shared/api/adapters/collection/collection';
import { MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import { NotFoundError, type CollectionStorage } from '@/shared/api/adapters/collection/storage';

interface Row { id: string; name: string; }

/** 저장한 배열을 복제 없이 그대로 돌려주는 스토리지. 복제 책임이 Collection에 있는지 판별한다. */
class LiveArrayStorage implements CollectionStorage {
  private data = new Map<string, unknown[]>();
  async read<T>(collection: string): Promise<T[] | undefined> { return this.data.get(collection) as T[] | undefined; }
  async write<T>(collection: string, rows: T[]): Promise<void> { this.data.set(collection, rows); }
  async clear(): Promise<void> { this.data.clear(); }
}

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

  it('시드 배열 자체를 변형하지 않는다(update 후에도 원본 시드가 그대로)', async () => {
    const seed: Row[] = [{ id: 'a', name: 'A' }];
    const storage = new MemoryStorage();
    const col = new Collection<Row>(storage, 'rows', () => seed);
    await col.update('a', { name: 'B' });
    expect(seed).toEqual([{ id: 'a', name: 'A' }]);
  });

  it('시드 경로의 all()이 돌려준 배열을 변형해도 시드 캐시가 오염되지 않는다', async () => {
    // MemoryStorage는 write에서 복제하므로 이 방어를 판별하지 못한다. 라이브 배열을 그대로
    // 돌려주는 스토리지를 써야 Collection.all()의 structuredClone이 실제로 검증된다.
    const seed: Row[] = [{ id: 'a', name: 'A' }];
    const storage = new LiveArrayStorage();
    const col = new Collection<Row>(storage, 'rows', () => seed);

    const rows = await col.all();
    rows.sort(() => -1);
    rows[0].name = 'MUTATED';

    expect(seed).toEqual([{ id: 'a', name: 'A' }]);
    expect(await storage.read<Row>('rows')).toEqual([{ id: 'a', name: 'A' }]);
  });

  it('동시 쓰기 두 건이 유실 없이 모두 반영된다', async () => {
    const { col } = makeCollection();
    await Promise.all([col.insert({ id: 'a', name: 'A' }), col.insert({ id: 'b', name: 'B' })]);
    expect((await col.all()).map((row) => row.id).sort()).toEqual(['a', 'b']);
  });

  it('동시 update 두 건이 서로를 덮어쓰지 않는다', async () => {
    const { col } = makeCollection([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]);
    await Promise.all([col.update('a', { name: 'A2' }), col.update('b', { name: 'B2' })]);
    expect(await col.all()).toEqual([{ id: 'a', name: 'A2' }, { id: 'b', name: 'B2' }]);
  });

  it('큐의 한 작업이 실패해도 뒤따르는 쓰기가 막히지 않는다', async () => {
    const { col } = makeCollection();
    const failing = col.update('missing', { name: 'X' });
    const following = col.insert({ id: 'a', name: 'A' });

    await expect(failing).rejects.toBeInstanceOf(NotFoundError);
    await expect(following).resolves.toEqual({ id: 'a', name: 'A' });
    expect(await col.all()).toEqual([{ id: 'a', name: 'A' }]);
  });

  it('replaceAll은 전체를 덮어쓴다', async () => {
    const { col } = makeCollection([{ id: 'a', name: 'A' }]);
    await col.replaceAll([{ id: 'z', name: 'Z' }]);
    expect(await col.all()).toEqual([{ id: 'z', name: 'Z' }]);
  });
});
