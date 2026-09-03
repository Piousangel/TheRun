import { Collection } from '@/shared/api/adapters/collection/collection';
import { createCollectionMemberRepo, newId } from '@/shared/api/adapters/collection/member-repo';
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

describe('newId', () => {
  it('crypto.randomUUID가 있으면 그것을 쓴다', () => {
    expect(newId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('보안 컨텍스트가 아니어서 randomUUID가 없어도 고유한 id를 만든다', () => {
    // http://192.168.x.x:3000 처럼 LAN IP로 데모를 열면 randomUUID는 undefined다(getRandomValues는 남는다).
    const real = globalThis.crypto;
    vi.stubGlobal('crypto', { getRandomValues: real.getRandomValues.bind(real) });
    try {
      expect(crypto.randomUUID).toBeUndefined();
      const ids = new Set(Array.from({ length: 500 }, () => newId()));
      expect(ids.size).toBe(500);
      for (const id of ids) expect(id.length).toBeGreaterThanOrEqual(16);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('crypto 전역 자체가 없어도 id를 만든다', () => {
    vi.stubGlobal('crypto', undefined);
    try {
      const ids = new Set(Array.from({ length: 200 }, () => newId()));
      expect(ids.size).toBe(200);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
