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

  it('시드 배열 자체를 변형하지 않는다(update 후에도 원본 시드가 그대로)', async () => {
    const seed: Row[] = [{ id: 'a', name: 'A' }];
    const storage = new MemoryStorage();
    const col = new Collection<Row>(storage, 'rows', () => seed);
    await col.update('a', { name: 'B' });
    expect(seed).toEqual([{ id: 'a', name: 'A' }]);
  });

  it('all()이 돌려준 배열을 호출자가 변형해도 저장소에 반영되지 않는다', async () => {
    const { storage, col } = makeCollection([{ id: 'a', name: 'A' }]);
    const rows = await col.all();
    rows.sort(() => -1);
    rows[0].name = 'MUTATED';
    expect(await storage.read<Row>('rows')).toEqual([{ id: 'a', name: 'A' }]);
  });

  it('replaceAll은 전체를 덮어쓴다', async () => {
    const { col } = makeCollection([{ id: 'a', name: 'A' }]);
    await col.replaceAll([{ id: 'z', name: 'Z' }]);
    expect(await col.all()).toEqual([{ id: 'z', name: 'Z' }]);
  });
});
