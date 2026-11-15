import type { Collection } from '@/shared/api/adapters/collection/collection';
import { NotFoundError } from '@/shared/api/adapters/collection/storage';
import type { LeagueRepo } from '@/shared/api/ports/league-repo';
import { newId } from '@/shared/lib/id';
import { addDaysIso, buildMatchdayPairings } from '@/shared/lib/league-schedule';
import type { Fixture, LeagueTeam, Matchday, Season } from '@/shared/types/league';

interface Deps {
  seasons: Collection<Season>;
  teams: Collection<LeagueTeam>;
  matchdays: Collection<Matchday>;
  fixtures: Collection<Fixture>;
  now: () => Date;
}

export function createCollectionLeagueRepo({ seasons, teams, matchdays, fixtures, now }: Deps): LeagueRepo {
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
  };
}
