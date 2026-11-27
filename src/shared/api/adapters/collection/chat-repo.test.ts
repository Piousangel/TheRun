import { createCollectionAuditRepo } from '@/shared/api/adapters/collection/audit-repo';
import { createCollectionChatRepo } from '@/shared/api/adapters/collection/chat-repo';
import { Collection } from '@/shared/api/adapters/collection/collection';
import { createCollectionLeagueRepo } from '@/shared/api/adapters/collection/league-repo';
import { MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import { runChatRepoContract } from '@/shared/api/adapters/contracts/chat-repo.contract';

runChatRepoContract(async () => {
  const storage = new MemoryStorage();
  let tick = 0;
  // 메시지 시간순·읽음 비교가 안정적이도록 호출마다 1초씩 흐르는 시계
  const now = () => new Date(Date.UTC(2026, 10, 28, 0, 0, tick++));
  const audit = createCollectionAuditRepo(new Collection(storage, 'audit_logs', () => []), now);
  const league = createCollectionLeagueRepo({
    seasons: new Collection(storage, 'league_seasons', () => []),
    teams: new Collection(storage, 'league_teams', () => []),
    matchdays: new Collection(storage, 'league_matchdays', () => []),
    fixtures: new Collection(storage, 'league_fixtures', () => []),
    goals: new Collection(storage, 'league_goals', () => []),
    appearances: new Collection(storage, 'league_appearances', () => []),
    miniGames: new Collection(storage, 'league_minigames', () => []),
    availability: new Collection(storage, 'league_availability', () => []),
    drafts: new Collection(storage, 'league_drafts', () => []),
    audit,
    now,
  });
  const repo = createCollectionChatRepo({
    messages: new Collection(storage, 'chat_messages', () => []),
    reads: new Collection(storage, 'chat_reads', () => []),
    league,
    audit,
    now,
  });
  return { repo, league, audit };
});
