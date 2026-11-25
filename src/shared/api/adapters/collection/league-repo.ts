import type { Collection } from '@/shared/api/adapters/collection/collection';
import { NotFoundError } from '@/shared/api/adapters/collection/storage';
import type { AuditRepo } from '@/shared/api/ports/audit-repo';
import type { LeagueRepo } from '@/shared/api/ports/league-repo';
import { newId } from '@/shared/lib/id';
import { addDaysIso, buildMatchdayPairings } from '@/shared/lib/league-schedule';
import type { Appearance, Fixture, GoalEvent, LeagueTeam, LineupAuditSnapshot, Matchday, Season } from '@/shared/types/league';

interface Deps {
  seasons: Collection<Season>;
  teams: Collection<LeagueTeam>;
  matchdays: Collection<Matchday>;
  fixtures: Collection<Fixture>;
  goals: Collection<GoalEvent>;
  appearances: Collection<Appearance>;
  /** 골 기록·삭제를 경기(`fixture`) 단위 변경 이력으로 남긴다 */
  audit: AuditRepo;
  now: () => Date;
}

export function createCollectionLeagueRepo({ seasons, teams, matchdays, fixtures, goals, appearances, audit, now }: Deps): LeagueRepo {
  const seasonMatchdays = async (seasonId: string) =>
    (await matchdays.all()).filter((m) => m.season_id === seasonId).sort((a, b) => a.week - b.week);

  async function seasonFixtures(seasonId: string) {
    const days = await seasonMatchdays(seasonId);
    const weekOf = new Map(days.map((d) => [d.id, d.week]));
    return (await fixtures.all())
      .filter((f) => weekOf.has(f.matchday_id))
      .sort((a, b) => (weekOf.get(a.matchday_id)! - weekOf.get(b.matchday_id)!) || a.order - b.order);
  }

  async function requireSeason(id: string) {
    const season = await seasons.get(id);
    if (!season) throw new NotFoundError('seasons', id);
    return season;
  }

  async function requirePlayableFixture(fixtureId: string, teamId: string, quarter: number) {
    const fixture = await fixtures.get(fixtureId);
    if (!fixture) throw new NotFoundError('fixtures', fixtureId);
    if (teamId !== fixture.home_team_id && teamId !== fixture.away_team_id) {
      throw new Error('이 경기의 팀이 아닙니다.');
    }
    const day = await matchdays.get(fixture.matchday_id);
    const season = day ? await seasons.get(day.season_id) : null;
    const maxQuarter = season?.quarters_per_match ?? 1;
    if (!Number.isInteger(quarter) || quarter < 1 || quarter > maxQuarter) {
      throw new Error(`쿼터는 1~${maxQuarter} 사이여야 합니다.`);
    }
    return fixture;
  }

  return {
    async listSeasons() {
      return (await seasons.all()).sort((a, b) => b.starts_on.localeCompare(a.starts_on));
    },
    getSeason: (id) => seasons.get(id),
    async createSeason(data) {
      const at = now().toISOString();
      return seasons.insert({
        id: newId(),
        name: data.name,
        starts_on: data.starts_on,
        ends_on: data.ends_on,
        status: 'draft',
        quarters_per_match: data.quarters_per_match ?? 3,
        quarter_minutes: data.quarter_minutes ?? 10,
        players_per_side: data.players_per_side ?? 6,
        points: data.points ?? { win: 3, draw: 1, loss: 0 },
        tiebreakers: data.tiebreakers ?? ['goal_diff', 'goals_for', 'head_to_head'],
        mvp_method: data.mvp_method ?? 'member_vote',
        created_at: at,
        updated_at: at,
      });
    },
    updateSeason: (id, data) => seasons.update(id, { ...data, updated_at: now().toISOString() }),
    async removeSeason(id) {
      const days = await seasonMatchdays(id);
      const dayIds = new Set(days.map((d) => d.id));
      const fixtureIds = new Set((await fixtures.all()).filter((f) => dayIds.has(f.matchday_id)).map((f) => f.id));
      await goals.replaceAll((await goals.all()).filter((g) => !fixtureIds.has(g.fixture_id)));
      await appearances.replaceAll((await appearances.all()).filter((a) => !fixtureIds.has(a.fixture_id)));
      await fixtures.replaceAll((await fixtures.all()).filter((f) => !dayIds.has(f.matchday_id)));
      await matchdays.replaceAll((await matchdays.all()).filter((m) => m.season_id !== id));
      await teams.replaceAll((await teams.all()).filter((t) => t.season_id !== id));
      await seasons.remove(id);
    },

    async listTeams(seasonId) {
      return (await teams.all()).filter((t) => t.season_id === seasonId).sort((a, b) => a.created_at.localeCompare(b.created_at));
    },
    async createTeam(data) {
      await requireSeason(data.season_id);
      return teams.insert({
        id: newId(),
        season_id: data.season_id,
        name: data.name,
        color: data.color,
        captain_member_id: data.captain_member_id ?? null,
        created_at: now().toISOString(),
      });
    },
    updateTeam: (id, data) => teams.update(id, data),
    async removeTeam(id) {
      const team = await teams.get(id);
      if (!team) return;
      if ((await seasonMatchdays(team.season_id)).length > 0) {
        throw new Error('일정이 만들어진 시즌에서는 팀을 지울 수 없습니다. 일정을 다시 만든 뒤 지우세요.');
      }
      await teams.remove(id);
    },

    listMatchdays: seasonMatchdays,
    listFixtures: seasonFixtures,
    async generateSchedule(seasonId, input) {
      await requireSeason(seasonId);
      const teamIds = (await teams.all())
        .filter((t) => t.season_id === seasonId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((t) => t.id);
      const pairings = buildMatchdayPairings(teamIds, input.weeks ?? 4);

      const existing = await seasonFixtures(seasonId);
      if (existing.some((f) => f.status !== 'scheduled')) {
        throw new Error('이미 시작된 경기가 있어 일정을 다시 만들 수 없습니다.');
      }

      const newDays: Matchday[] = pairings.map((_, i) => ({
        id: newId(),
        season_id: seasonId,
        week: i + 1,
        date: addDaysIso(input.first_date, i * 7),
        venue: input.venue ?? null,
      }));
      const newFixtures: Fixture[] = pairings.flatMap((pairs, i) =>
        pairs.map(([home, away], k) => ({
          id: newId(),
          matchday_id: newDays[i].id,
          order: k + 1,
          home_team_id: home,
          away_team_id: away,
          status: 'scheduled' as const,
        })),
      );

      const oldDayIds = new Set((await seasonMatchdays(seasonId)).map((d) => d.id));
      await fixtures.replaceAll([...(await fixtures.all()).filter((f) => !oldDayIds.has(f.matchday_id)), ...newFixtures]);
      await matchdays.replaceAll([...(await matchdays.all()).filter((m) => m.season_id !== seasonId), ...newDays]);
      return { matchdays: newDays, fixtures: newFixtures };
    },
    setFixtureStatus: (fixtureId, status) => fixtures.update(fixtureId, { status }),

    async listGoals(seasonId) {
      const ids = new Set((await seasonFixtures(seasonId)).map((f) => f.id));
      return (await goals.all()).filter((g) => ids.has(g.fixture_id)).sort((a, b) => a.created_at.localeCompare(b.created_at));
    },
    async addGoal(data) {
      if (data.id) {
        const existing = await goals.get(data.id);
        if (existing) return existing;
      }
      const fixture = await requirePlayableFixture(data.fixture_id, data.team_id, data.quarter);
      if (fixture.status === 'scheduled') throw new Error('경기를 시작한 뒤에 골을 기록할 수 있습니다.');
      if (data.scorer_id && data.assist_id && data.scorer_id === data.assist_id) {
        throw new Error('득점자와 도움 선수가 같을 수 없습니다.');
      }
      const goal = await goals.insert({
        id: data.id ?? newId(),
        fixture_id: data.fixture_id,
        quarter: data.quarter,
        team_id: data.team_id,
        scorer_id: data.scorer_id ?? null,
        assist_id: data.own_goal ? null : (data.assist_id ?? null),
        own_goal: data.own_goal ?? false,
        created_by: data.created_by ?? null,
        created_at: now().toISOString(),
      });
      await audit.record({ entity: 'fixture', entity_id: goal.fixture_id, action: 'create', after: goal, actor_id: goal.created_by ?? 'unknown' });
      return goal;
    },
    async removeGoal(id, actorId) {
      const goal = await goals.get(id);
      if (!goal) return;
      await goals.remove(id);
      await audit.record({ entity: 'fixture', entity_id: goal.fixture_id, action: 'delete', before: goal, actor_id: actorId ?? 'unknown' });
    },

    async listAppearances(seasonId) {
      const ids = new Set((await seasonFixtures(seasonId)).map((f) => f.id));
      return (await appearances.all()).filter((a) => ids.has(a.fixture_id));
    },
    async setLineup(data) {
      await requirePlayableFixture(data.fixture_id, data.team_id, data.quarter);
      const memberIds = [...new Set(data.member_ids)];
      const all = await appearances.all();
      const sameQuarter = all.filter((a) => a.fixture_id === data.fixture_id && a.quarter === data.quarter);
      const clash = sameQuarter.find((a) => a.team_id !== data.team_id && memberIds.includes(a.member_id));
      if (clash) throw new Error('같은 쿼터에 상대 팀 명단에 있는 선수입니다.');

      const isMine = (a: Appearance) => a.fixture_id === data.fixture_id && a.quarter === data.quarter && a.team_id === data.team_id;
      const before = sameQuarter.filter(isMine).map((a) => a.member_id);
      const unchanged = before.length === memberIds.length && memberIds.every((id) => before.includes(id));
      if (unchanged) return all.filter(isMine);

      const at = now().toISOString();
      const next: Appearance[] = memberIds.map((member_id) => ({
        id: newId(),
        fixture_id: data.fixture_id,
        quarter: data.quarter,
        team_id: data.team_id,
        member_id,
        created_at: at,
      }));
      await appearances.replaceAll([...all.filter((a) => !isMine(a)), ...next]);
      const snapshot = (member_ids: string[]): LineupAuditSnapshot => ({ kind: 'lineup', quarter: data.quarter, team_id: data.team_id, member_ids });
      await audit.record({
        entity: 'fixture',
        entity_id: data.fixture_id,
        action: before.length === 0 ? 'create' : memberIds.length === 0 ? 'delete' : 'update',
        before: before.length === 0 ? null : snapshot(before),
        after: memberIds.length === 0 ? null : snapshot(memberIds),
        actor_id: data.actor_id ?? 'unknown',
      });
      return next;
    },
  };
}
