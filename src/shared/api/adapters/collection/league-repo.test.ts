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
    appearances: new Collection(storage, 'league_appearances', () => []),
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
      appearances: new Collection(storage, 'league_appearances', () => []),
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

    // 출전 명단: 처음 저장은 create, 바꾸면 update(전후 명단), 같은 명단을 다시 저장하면 기록하지 않는다
    const lineup = { fixture_id: fixtures[0].id, quarter: 1, team_id: fixtures[0].home_team_id };
    await repo.setLineup({ ...lineup, member_ids: ['m1', 'm2'], actor_id: 'u1' });
    await repo.setLineup({ ...lineup, member_ids: ['m2', 'm1'], actor_id: 'u1' });
    await repo.setLineup({ ...lineup, member_ids: ['m1', 'm3'], actor_id: 'u2' });
    const lineupLogs = (await audit.listFor('fixture', fixtures[0].id)).slice(0, 2);
    expect(lineupLogs.map((l) => [l.action, l.actor_id])).toEqual([['update', 'u2'], ['create', 'u1']]);
    expect(lineupLogs[0].before).toMatchObject({ kind: 'lineup', quarter: 1, member_ids: ['m1', 'm2'] });
    expect(lineupLogs[0].after).toMatchObject({ kind: 'lineup', member_ids: ['m1', 'm3'] });
  });
});
