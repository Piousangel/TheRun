import type { Collection } from '@/shared/api/adapters/collection/collection';
import { NotFoundError } from '@/shared/api/adapters/collection/storage';
import type { AuditRepo } from '@/shared/api/ports/audit-repo';
import type { LeagueRepo } from '@/shared/api/ports/league-repo';
import { newId } from '@/shared/lib/id';
import { addDaysIso, buildMatchdayPairings, seasonWeekCount } from '@/shared/lib/league-schedule';
import type { Appearance, Availability, Fixture, GoalEvent, LeagueTeam, LineupAuditSnapshot, Matchday, MiniGame, Season } from '@/shared/types/league';

interface Deps {
  seasons: Collection<Season>;
  teams: Collection<LeagueTeam>;
  matchdays: Collection<Matchday>;
  fixtures: Collection<Fixture>;
  goals: Collection<GoalEvent>;
  appearances: Collection<Appearance>;
  miniGames: Collection<MiniGame>;
  availability: Collection<Availability>;
  /** 골 기록·삭제를 경기(`fixture`) 단위 변경 이력으로 남긴다 */
  audit: AuditRepo;
  now: () => Date;
}

export function createCollectionLeagueRepo({ seasons, teams, matchdays, fixtures, goals, appearances, miniGames, availability, audit, now }: Deps): LeagueRepo {
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
      await miniGames.replaceAll((await miniGames.all()).filter((g) => g.season_id !== id));
      await availability.replaceAll((await availability.all()).filter((a) => a.season_id !== id));
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
    async listMiniGames(seasonId) {
      const weekOf = new Map((await seasonMatchdays(seasonId)).map((d) => [d.id, d.week]));
      const week = (g: MiniGame) => (g.matchday_id ? (weekOf.get(g.matchday_id) ?? Infinity) : Infinity);
      return (await miniGames.all())
        .filter((g) => g.season_id === seasonId)
        .sort((a, b) => week(a) - week(b) || a.created_at.localeCompare(b.created_at));
    },
    async createMiniGame(data) {
      await requireSeason(data.season_id);
      const name = data.name.trim();
      if (!name) throw new Error('미니게임 이름을 입력하세요.');
      const points = data.points ?? [1];
      if (points.length < 1 || points.length > 3 || points.some((p) => !Number.isInteger(p) || p < 0)) {
        throw new Error('승점은 1~3위까지 0 이상의 정수로 정합니다.');
      }
      if (data.matchday_id) {
        const day = await matchdays.get(data.matchday_id);
        if (!day || day.season_id !== data.season_id) throw new Error('이 시즌의 경기일이 아닙니다.');
      }
      const at = now().toISOString();
      const game = await miniGames.insert({
        id: newId(),
        season_id: data.season_id,
        matchday_id: data.matchday_id ?? null,
        name,
        description: data.description?.trim() || null,
        points,
        results: [],
        created_at: at,
        updated_at: at,
      });
      await audit.record({ entity: 'minigame', entity_id: game.id, action: 'create', after: game, actor_id: data.actor_id ?? 'unknown' });
      return game;
    },
    async removeMiniGame(id, actorId) {
      const game = await miniGames.get(id);
      if (!game) return;
      await miniGames.remove(id);
      await audit.record({ entity: 'minigame', entity_id: id, action: 'delete', before: game, actor_id: actorId ?? 'unknown' });
    },
    async setMiniGameResults(data) {
      const game = await miniGames.get(data.minigame_id);
      if (!game) throw new NotFoundError('minigames', data.minigame_id);
      const teamIds = new Set((await teams.all()).filter((t) => t.season_id === game.season_id).map((t) => t.id));
      const seen = new Set<string>();
      for (const r of data.results) {
        if (!teamIds.has(r.team_id)) throw new Error('이 시즌의 팀이 아닙니다.');
        if (seen.has(r.team_id)) throw new Error('같은 팀이 두 번 들어 있습니다.');
        if (!Number.isInteger(r.rank) || r.rank < 1 || r.rank > teamIds.size) throw new Error(`등수는 1~${teamIds.size} 사이여야 합니다.`);
        seen.add(r.team_id);
      }
      const results = [...data.results].sort((a, b) => a.rank - b.rank).map(({ team_id, rank }) => ({ team_id, rank }));
      const updated = await miniGames.update(game.id, { results, updated_at: now().toISOString() });
      await audit.record({
        entity: 'minigame',
        entity_id: game.id,
        action: game.results.length === 0 ? 'create' : results.length === 0 ? 'delete' : 'update',
        before: game.results.length === 0 ? null : { kind: 'minigame_results', results: game.results },
        after: results.length === 0 ? null : { kind: 'minigame_results', results },
        actor_id: data.actor_id ?? 'unknown',
      });
      return updated;
    },

    async listAvailability(seasonId) {
      return (await availability.all()).filter((a) => a.season_id === seasonId);
    },
    async setAvailability(data) {
      const season = await requireSeason(data.season_id);
      if (season.status === 'done') throw new Error('끝난 시즌은 참석 가능 주차를 바꿀 수 없습니다.');
      if (!data.member_id) throw new Error('회원을 골라 주세요.');
      const maxWeek = seasonWeekCount(season.starts_on, season.ends_on, (await seasonMatchdays(season.id)).length);
      for (const w of data.weeks) {
        if (!Number.isInteger(w) || w < 1 || w > maxWeek) throw new Error(`주차는 1~${maxWeek} 사이여야 합니다.`);
      }
      const weeks = [...new Set(data.weeks)].sort((a, b) => a - b);
      const id = `${season.id}:${data.member_id}`;
      const before = await availability.get(id);
      const row: Availability = { id, season_id: season.id, member_id: data.member_id, weeks, updated_at: now().toISOString() };
      const saved = before ? await availability.update(id, { weeks, updated_at: row.updated_at }) : await availability.insert(row);
      const same = before && before.weeks.length === weeks.length && before.weeks.every((w, i) => w === weeks[i]);
      if (!same) {
        await audit.record({
          entity: 'season',
          entity_id: season.id,
          action: before ? 'update' : 'create',
          before: before ? { kind: 'availability', member_id: data.member_id, weeks: before.weeks } : null,
          after: { kind: 'availability', member_id: data.member_id, weeks },
          actor_id: data.actor_id ?? 'unknown',
        });
      }
      return saved;
    },
  };
}
