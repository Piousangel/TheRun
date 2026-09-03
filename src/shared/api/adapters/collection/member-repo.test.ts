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
