import { Collection } from '@/shared/api/adapters/collection/collection';
import { createCollectionMatchRepo } from '@/shared/api/adapters/collection/match-repo';
import { MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import { buildSeed } from '@/shared/api/adapters/collection/seed';
import { runMatchRepoContract } from '@/shared/api/adapters/contracts/match-repo.contract';

const NOW = new Date('2026-09-03T10:00:00+09:00');

runMatchRepoContract(async () => {
  const seed = buildSeed(NOW);
  const matches = new Collection(new MemoryStorage(), 'matches', () => seed.matches);
  return { repo: createCollectionMatchRepo(matches, () => NOW), seededCount: seed.matches.length };
});
