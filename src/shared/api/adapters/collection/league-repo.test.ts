import { Collection } from '@/shared/api/adapters/collection/collection';
import { createCollectionLeagueRepo } from '@/shared/api/adapters/collection/league-repo';
import { MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import { runLeagueRepoContract } from '@/shared/api/adapters/contracts/league-repo.contract';

runLeagueRepoContract(async () => {
  const storage = new MemoryStorage();
  let tick = 0;
  // createdAt 정렬이 안정적이도록 호출마다 1초씩 흐르는 시계
  const now = () => new Date(Date.UTC(2026, 10, 16, 0, 0, tick++));
  const repo = createCollectionLeagueRepo({
    seasons: new Collection(storage, 'league_seasons', () => []),
    teams: new Collection(storage, 'league_teams', () => []),
    matchdays: new Collection(storage, 'league_matchdays', () => []),
    fixtures: new Collection(storage, 'league_fixtures', () => []),
    now,
  });
  return { repo };
});
