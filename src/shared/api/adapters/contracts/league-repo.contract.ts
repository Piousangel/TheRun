import type { LeagueRepo } from '@/shared/api/ports/league-repo';

export function runLeagueRepoContract(makeRepo: () => Promise<{ repo: LeagueRepo }>) {
  async function seasonWithTeams(repo: LeagueRepo, teamCount: number) {
    const season = await repo.createSeason({ name: '2026 하반기', starts_on: '2026-12-05', ends_on: '2026-12-26' });
    for (let i = 0; i < teamCount; i += 1) {
      await repo.createTeam({ season_id: season.id, name: `팀${i + 1}`, color: '#2563eb' });
    }
    return season;
  }

  describe('LeagueRepo contract', () => {
    it('createSeason은 스펙 기본값을 채우고 starts_on 내림차순으로 나온다', async () => {
      const { repo } = await makeRepo();
      const a = await repo.createSeason({ name: '상반기', starts_on: '2026-03-01', ends_on: '2026-03-22' });
      const b = await repo.createSeason({ name: '하반기', starts_on: '2026-09-01', ends_on: '2026-09-22' });
      expect(a).toMatchObject({
        status: 'draft', quarters_per_match: 3, quarter_minutes: 10, players_per_side: 6,
        points: { win: 3, draw: 1, loss: 0 }, tiebreakers: ['goal_diff', 'goals_for', 'head_to_head'], mvp_method: 'member_vote',
      });
      expect((await repo.listSeasons()).map((s) => s.id)).toEqual([b.id, a.id]);
      const updated = await repo.updateSeason(a.id, { points: { win: 2, draw: 1, loss: 0 }, status: 'active' });
      expect(updated.points.win).toBe(2);
      expect((await repo.getSeason(a.id))?.status).toBe('active');
    });

    it('팀은 시즌별로 분리되고 팀장을 지정·변경할 수 있다', async () => {
      const { repo } = await makeRepo();
      const s1 = await seasonWithTeams(repo, 2);
      const s2 = await seasonWithTeams(repo, 3);
      expect(await repo.listTeams(s1.id)).toHaveLength(2);
      expect(await repo.listTeams(s2.id)).toHaveLength(3);
      const [team] = await repo.listTeams(s1.id);
      expect(team.captain_member_id).toBeNull();
      expect((await repo.updateTeam(team.id, { captain_member_id: 'm1' })).captain_member_id).toBe('m1');
    });

    it('3팀 일정: 4경기일 × 3경기 = 12경기, 날짜는 7일 간격', async () => {
      const { repo } = await makeRepo();
      const season = await seasonWithTeams(repo, 3);
      const { matchdays, fixtures } = await repo.generateSchedule(season.id, { first_date: '2026-12-05' });
      expect(matchdays.map((m) => m.date)).toEqual(['2026-12-05', '2026-12-12', '2026-12-19', '2026-12-26']);
      expect(fixtures).toHaveLength(12);
      expect(fixtures.every((f) => f.status === 'scheduled')).toBe(true);
      expect(await repo.listMatchdays(season.id)).toEqual(matchdays);
      expect((await repo.listFixtures(season.id)).map((f) => f.id)).toEqual(fixtures.map((f) => f.id));
    });

    it('일정을 다시 만들면 이전 일정을 교체한다', async () => {
      const { repo } = await makeRepo();
      const season = await seasonWithTeams(repo, 3);
      await repo.generateSchedule(season.id, { first_date: '2026-12-05' });
      await repo.generateSchedule(season.id, { first_date: '2026-12-12', weeks: 2 });
      expect(await repo.listMatchdays(season.id)).toHaveLength(2);
      expect(await repo.listFixtures(season.id)).toHaveLength(6);
    });

    it('시작된 경기가 있으면 재생성을 거부하고, 일정이 있으면 팀 삭제도 거부한다', async () => {
      const { repo } = await makeRepo();
      const season = await seasonWithTeams(repo, 3);
      const { fixtures } = await repo.generateSchedule(season.id, { first_date: '2026-12-05' });
      const [team] = await repo.listTeams(season.id);
      await expect(repo.removeTeam(team.id)).rejects.toThrow();
      await repo.setFixtureStatus(fixtures[0].id, 'live');
      await expect(repo.generateSchedule(season.id, { first_date: '2026-12-05' })).rejects.toThrow();
    });

    it('팀이 2개 미만이면 일정을 만들 수 없다', async () => {
      const { repo } = await makeRepo();
      const season = await seasonWithTeams(repo, 1);
      await expect(repo.generateSchedule(season.id, { first_date: '2026-12-05' })).rejects.toThrow();
    });

    it('removeSeason은 팀·경기일·경기를 함께 지우고 다른 시즌은 건드리지 않는다', async () => {
      const { repo } = await makeRepo();
      const keep = await seasonWithTeams(repo, 3);
      await repo.generateSchedule(keep.id, { first_date: '2026-12-05' });
      const drop = await seasonWithTeams(repo, 3);
      await repo.generateSchedule(drop.id, { first_date: '2026-12-05' });
      await repo.removeSeason(drop.id);
      expect(await repo.getSeason(drop.id)).toBeNull();
      expect(await repo.listTeams(drop.id)).toEqual([]);
      expect(await repo.listFixtures(drop.id)).toEqual([]);
      expect(await repo.listFixtures(keep.id)).toHaveLength(12);
    });

    async function liveFixture(repo: LeagueRepo) {
      const season = await seasonWithTeams(repo, 3);
      const { fixtures } = await repo.generateSchedule(season.id, { first_date: '2026-12-05' });
      const fixture = await repo.setFixtureStatus(fixtures[0].id, 'live');
      return { season, fixture, fixtures };
    }

    it('골은 시즌별로 기록 순서대로 나오고, 같은 id로 다시 보내도 한 번만 남는다(멱등)', async () => {
      const { repo } = await makeRepo();
      const { season, fixture } = await liveFixture(repo);
      const first = await repo.addGoal({ id: 'g-1', fixture_id: fixture.id, quarter: 1, team_id: fixture.home_team_id, scorer_id: 'm1', assist_id: 'm2' });
      const again = await repo.addGoal({ id: 'g-1', fixture_id: fixture.id, quarter: 1, team_id: fixture.home_team_id, scorer_id: 'm1' });
      expect(again).toEqual(first);
      await repo.addGoal({ fixture_id: fixture.id, quarter: 2, team_id: fixture.away_team_id, scorer_id: 'm3' });
      const goals = await repo.listGoals(season.id);
      expect(goals).toHaveLength(2);
      expect(goals[0]).toMatchObject({ id: 'g-1', quarter: 1, scorer_id: 'm1', assist_id: 'm2', own_goal: false });
      expect(goals[1].assist_id).toBeNull();

      const other = await liveFixture(repo);
      expect(await repo.listGoals(other.season.id)).toEqual([]);
    });

    it('경기 전·다른 팀·범위 밖 쿼터·득점자=도움이면 거부한다', async () => {
      const { repo } = await makeRepo();
      const { fixture, fixtures } = await liveFixture(repo);
      const outsider = fixtures.find((f) => f.home_team_id !== fixture.home_team_id && f.home_team_id !== fixture.away_team_id)?.home_team_id
        ?? fixtures.find((f) => f.away_team_id !== fixture.home_team_id && f.away_team_id !== fixture.away_team_id)!.away_team_id;
      await expect(repo.addGoal({ fixture_id: fixtures[1].id, quarter: 1, team_id: fixtures[1].home_team_id })).rejects.toThrow();
      await expect(repo.addGoal({ fixture_id: fixture.id, quarter: 1, team_id: outsider })).rejects.toThrow();
      await expect(repo.addGoal({ fixture_id: fixture.id, quarter: 4, team_id: fixture.home_team_id })).rejects.toThrow();
      await expect(repo.addGoal({ fixture_id: fixture.id, quarter: 0, team_id: fixture.home_team_id })).rejects.toThrow();
      await expect(repo.addGoal({ fixture_id: fixture.id, quarter: 1, team_id: fixture.home_team_id, scorer_id: 'm1', assist_id: 'm1' })).rejects.toThrow();
    });

    it('자책골에는 도움이 붙지 않고, 끝난 경기도 고칠 수 있으며, removeGoal은 한 건만 지운다', async () => {
      const { repo } = await makeRepo();
      const { season, fixture } = await liveFixture(repo);
      const own = await repo.addGoal({ fixture_id: fixture.id, quarter: 1, team_id: fixture.home_team_id, scorer_id: 'm9', assist_id: 'm2', own_goal: true });
      expect(own).toMatchObject({ own_goal: true, assist_id: null });
      await repo.setFixtureStatus(fixture.id, 'final');
      const late = await repo.addGoal({ fixture_id: fixture.id, quarter: 3, team_id: fixture.away_team_id });
      await repo.removeGoal(own.id);
      await repo.removeGoal('없는-골');
      expect((await repo.listGoals(season.id)).map((g) => g.id)).toEqual([late.id]);
    });

    it('removeSeason은 그 시즌의 골도 지운다', async () => {
      const { repo } = await makeRepo();
      const { season, fixture } = await liveFixture(repo);
      await repo.addGoal({ fixture_id: fixture.id, quarter: 1, team_id: fixture.home_team_id });
      await repo.removeSeason(season.id);
      expect(await repo.listGoals(season.id)).toEqual([]);
    });

    it('setLineup은 경기·쿼터·팀 단위로 명단을 통째로 바꾸고, 중복은 한 번만 남긴다', async () => {
      const { repo } = await makeRepo();
      const { season, fixture } = await liveFixture(repo);
      const home = { fixture_id: fixture.id, team_id: fixture.home_team_id };
      const q1 = await repo.setLineup({ ...home, quarter: 1, member_ids: ['m1', 'm2', 'm2'] });
      expect(q1.map((a) => a.member_id).sort()).toEqual(['m1', 'm2']);
      expect(q1[0]).toMatchObject({ fixture_id: fixture.id, quarter: 1, team_id: fixture.home_team_id });
      await repo.setLineup({ ...home, quarter: 2, member_ids: ['m1', 'm2'] });
      await repo.setLineup({ fixture_id: fixture.id, team_id: fixture.away_team_id, quarter: 1, member_ids: ['m5'] });

      // 1쿼터 홈 명단만 바뀌고 다른 쿼터·상대 팀 명단은 그대로다
      await repo.setLineup({ ...home, quarter: 1, member_ids: ['m1', 'm3'] });
      const key = (a: { quarter: number; team_id: string; member_id: string }) =>
        `${a.quarter}-${a.team_id === fixture.home_team_id ? 'H' : 'A'}-${a.member_id}`;
      expect((await repo.listAppearances(season.id)).map(key).sort()).toEqual(['1-A-m5', '1-H-m1', '1-H-m3', '2-H-m1', '2-H-m2']);

      // 빈 명단으로 저장하면 그 명단이 사라진다
      await repo.setLineup({ ...home, quarter: 2, member_ids: [] });
      expect((await repo.listAppearances(season.id)).filter((a) => a.quarter === 2)).toEqual([]);

      const other = await liveFixture(repo);
      expect(await repo.listAppearances(other.season.id)).toEqual([]);
    });

    it('setLineup은 다른 팀·범위 밖 쿼터·같은 쿼터 상대 팀 선수를 거부한다', async () => {
      const { repo } = await makeRepo();
      const { fixture, fixtures } = await liveFixture(repo);
      const outsider = [fixtures[1].home_team_id, fixtures[1].away_team_id].find(
        (id) => id !== fixture.home_team_id && id !== fixture.away_team_id,
      )!;
      await expect(repo.setLineup({ fixture_id: fixture.id, quarter: 1, team_id: outsider, member_ids: ['m1'] })).rejects.toThrow();
      await expect(repo.setLineup({ fixture_id: fixture.id, quarter: 4, team_id: fixture.home_team_id, member_ids: ['m1'] })).rejects.toThrow();
      await expect(repo.setLineup({ fixture_id: '없는-경기', quarter: 1, team_id: fixture.home_team_id, member_ids: ['m1'] })).rejects.toThrow();
      await repo.setLineup({ fixture_id: fixture.id, quarter: 1, team_id: fixture.home_team_id, member_ids: ['m1'] });
      await expect(repo.setLineup({ fixture_id: fixture.id, quarter: 1, team_id: fixture.away_team_id, member_ids: ['m1'] })).rejects.toThrow();
      // 다른 쿼터에서는 상대 팀으로 뛸 수 있다(경기 단위 임대는 쿼터마다 다를 수 있음)
      await expect(repo.setLineup({ fixture_id: fixture.id, quarter: 2, team_id: fixture.away_team_id, member_ids: ['m1'] })).resolves.toHaveLength(1);
    });

    it('removeSeason은 그 시즌의 출전 기록도 지운다', async () => {
      const { repo } = await makeRepo();
      const { season, fixture } = await liveFixture(repo);
      const other = await liveFixture(repo);
      await repo.setLineup({ fixture_id: fixture.id, quarter: 1, team_id: fixture.home_team_id, member_ids: ['m1'] });
      await repo.setLineup({ fixture_id: other.fixture.id, quarter: 1, team_id: other.fixture.home_team_id, member_ids: ['m2'] });
      await repo.removeSeason(season.id);
      expect(await repo.listAppearances(other.season.id)).toHaveLength(1);
    });
  });
}
