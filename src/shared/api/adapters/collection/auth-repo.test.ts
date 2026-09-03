import { createCollectionAuthRepo } from '@/shared/api/adapters/collection/auth-repo';
import { Collection } from '@/shared/api/adapters/collection/collection';
import { MemorySessionStore, MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import { buildSeed } from '@/shared/api/adapters/collection/seed';
import { runAuthRepoContract } from '@/shared/api/adapters/contracts/auth-repo.contract';

const NOW = new Date('2026-09-03T10:00:00+09:00');

runAuthRepoContract(async () => {
  const seed = buildSeed(NOW);
  const storage = new MemoryStorage();
  const repo = createCollectionAuthRepo({
    users: new Collection(storage, 'users', () => seed.users),
    profiles: new Collection(storage, 'app_profiles', () => seed.profiles),
    members: new Collection(storage, 'members', () => seed.members),
    session: new MemorySessionStore(),
    now: () => NOW,
  });
  return { repo, takenMemberId: 'm-02', freeMemberId: 'm-10' };
});

describe('createCollectionAuthRepo.signInWithOAuth', () => {
  it('로컬 어댑터는 url null', async () => {
    const seed = buildSeed(NOW);
    const storage = new MemoryStorage();
    const repo = createCollectionAuthRepo({
      users: new Collection(storage, 'users', () => seed.users),
      profiles: new Collection(storage, 'app_profiles', () => seed.profiles),
      members: new Collection(storage, 'members', () => seed.members),
      session: new MemorySessionStore(),
      now: () => NOW,
    });
    expect(await repo.signInWithOAuth('google', 'http://localhost/auth/callback')).toEqual({ url: null });
  });
});
