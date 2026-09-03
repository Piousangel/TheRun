import { Collection } from '@/shared/api/adapters/collection/collection';
import { MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import { buildSeed } from '@/shared/api/adapters/collection/seed';
import { createCollectionVoteRepo } from '@/shared/api/adapters/collection/vote-repo';
import { runVoteRepoContract } from '@/shared/api/adapters/contracts/vote-repo.contract';

const NOW = new Date('2026-09-03T10:00:00+09:00');

runVoteRepoContract(async () => {
  const seed = buildSeed(NOW);
  const storage = new MemoryStorage();
  const repo = createCollectionVoteRepo({
    sessions: new Collection(storage, 'vote_sessions', () => seed.voteSessions),
    responses: new Collection(storage, 'vote_responses', () => seed.voteResponses),
    members: new Collection(storage, 'members', () => seed.members),
    now: () => NOW,
  });
  return { repo, activeSessionId: 'vs-this-week', unrespondedMemberId: 'm-20' };
});
