import { createCollectionAuditRepo } from '@/shared/api/adapters/collection/audit-repo';
import { Collection } from '@/shared/api/adapters/collection/collection';
import { createCollectionLeagueRepo } from '@/shared/api/adapters/collection/league-repo';
import { MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import { runLeagueRepoContract } from '@/shared/api/adapters/contracts/league-repo.contract';

runLeagueRepoContract(async () => {
  const storage = new MemoryStorage();
  let tick = 0;
  // createdAt 정렬이 안정적이도록 호출마다 1초씩 흐르는 시계
  const now = () => new Date(Date.UTC(2026, 10, 16, 0, 0, tick++));
  const audit = createCollectionAuditRepo(new Collection(storage, 'audit_logs', () => []), now);
  const repo = createCollectionLeagueRepo({
    seasons: new Collection(storage, 'league_seasons', () => []),
    teams: new Collection(storage, 'league_teams', () => []),
    matchdays: new Collection(storage, 'league_matchdays', () => []),
    fixtures: new Collection(storage, 'league_fixtures', () => []),
    goals: new Collection(storage, 'league_goals', () => []),
    audit,
    now,
  });
  return { repo, audit };
});

describe('collection LeagueRepo — 골 감사 기록', () => {
  it('골 기록·삭제가 경기 변경 이력(entity=fixture)에 남는다', async () => {
    const storage = new MemoryStorage();
    let tick = 0;
    const now = () => new Date(Date.UTC(2026, 10, 16, 0, 0, tick++));
    const audit = createCollectionAuditRepo(new Collection(storage, 'audit_logs', () => []), now);
    const repo = createCollectionLeagueRepo({
      seasons: new Collection(storage, 'league_seasons', () => []),
      teams: new Collection(storage, 'league_teams', () => []),
      matchdays: new Collection(storage, 'league_matchdays', () => []),
      fixtures: new Collection(storage, 'league_fixtures', () => []),
      goals: new Collection(storage, 'league_goals', () => []),
      audit,
      now,
    });
    const season = await repo.createSeason({ name: 's', starts_on: '2026-12-05', ends_on: '2026-12-26' });
    await repo.createTeam({ season_id: season.id, name: 'A', color: '#000' });
    await repo.createTeam({ season_id: season.id, name: 'B', color: '#fff' });
    const { fixtures } = await repo.generateSchedule(season.id, { first_date: '2026-12-05', weeks: 1 });
    await repo.setFixtureStatus(fixtures[0].id, 'live');
    const goal = await repo.addGoal({ fixture_id: fixtures[0].id, quarter: 1, team_id: fixtures[0].home_team_id, created_by: 'u1' });
    await repo.removeGoal(goal.id, 'u2');
    const logs = await audit.listFor('fixture', fixtures[0].id);
    expect(logs.map((l) => [l.action, l.actor_id])).toEqual([['delete', 'u2'], ['create', 'u1']]);
  });
});
