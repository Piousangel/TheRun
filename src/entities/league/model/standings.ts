import type { Fixture, GoalEvent, LeagueTeam, Season } from '@/shared/types/league';

/** 순위·점수는 저장하지 않고 골 이벤트에서 계산한다(스펙 §2.2). */

export interface FixtureScore {
  home: number;
  away: number;
}

export function fixtureScore(fixture: Fixture, goals: readonly GoalEvent[]): FixtureScore {
  let home = 0;
  let away = 0;
  for (const g of goals) {
    if (g.fixture_id !== fixture.id) continue;
    if (g.team_id === fixture.home_team_id) home += 1;
    else if (g.team_id === fixture.away_team_id) away += 1;
  }
  return { home, away };
}

export interface StandingRow {
  team: LeagueTeam;
  rank: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
}

type Result = { fixture: Fixture; score: FixtureScore };

function pointsFor(teamId: string, r: Result, season: Season): number {
  const isHome = r.fixture.home_team_id === teamId;
  const mine = isHome ? r.score.home : r.score.away;
  const theirs = isHome ? r.score.away : r.score.home;
  if (mine > theirs) return season.points.win;
  if (mine < theirs) return season.points.loss;
  return season.points.draw;
}

/**
 * 끝난(final) 경기만 센다. 승점 → 시즌 동률 규칙 순서(득실차·다득점·승자승) → 팀 이름 순으로 정렬한다.
 * 승자승은 두 팀 사이 경기의 승점 합으로 비교한다. 모든 기준이 같으면 같은 순위를 준다.
 */
export function computeStandings(
  season: Season,
  teams: readonly LeagueTeam[],
  fixtures: readonly Fixture[],
  goals: readonly GoalEvent[],
): StandingRow[] {
  const results: Result[] = fixtures.filter((f) => f.status === 'final').map((fixture) => ({ fixture, score: fixtureScore(fixture, goals) }));

  const rows = teams.map((team): StandingRow => {
    const row: StandingRow = { team, rank: 0, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, goal_diff: 0, points: 0 };
    for (const r of results) {
      const isHome = r.fixture.home_team_id === team.id;
      if (!isHome && r.fixture.away_team_id !== team.id) continue;
      const mine = isHome ? r.score.home : r.score.away;
      const theirs = isHome ? r.score.away : r.score.home;
      row.played += 1;
      row.goals_for += mine;
      row.goals_against += theirs;
      if (mine > theirs) row.won += 1;
      else if (mine < theirs) row.lost += 1;
      else row.drawn += 1;
      row.points += pointsFor(team.id, r, season);
    }
    row.goal_diff = row.goals_for - row.goals_against;
    return row;
  });

  // 동률 그룹 안에서만 경기한 승점(미니 리그). 3팀 순환 승부도 한 그룹으로 공정하게 본다.
  const miniLeaguePoints = (row: StandingRow, group: readonly StandingRow[]) => {
    const ids = new Set(group.map((r) => r.team.id));
    let pts = 0;
    for (const r of results) {
      const { home_team_id: h, away_team_id: a } = r.fixture;
      if (ids.has(h) && ids.has(a) && (h === row.team.id || a === row.team.id)) pts += pointsFor(row.team.id, r, season);
    }
    return pts;
  };

  const keyOf = (criterion: 'points' | (typeof season.tiebreakers)[number], row: StandingRow, group: readonly StandingRow[]) => {
    if (criterion === 'points') return row.points;
    if (criterion === 'goal_diff') return row.goal_diff;
    if (criterion === 'goals_for') return row.goals_for;
    return miniLeaguePoints(row, group);
  };

  const criteria = ['points', ...season.tiebreakers] as const;
  /** 기준을 하나씩 적용해 그룹을 쪼갠다. 끝까지 같으면 같은 순위(이름순 표시). */
  const order = (group: StandingRow[], depth: number): StandingRow[][] => {
    if (group.length <= 1) return [group];
    if (depth >= criteria.length) return [[...group].sort((x, y) => x.team.name.localeCompare(y.team.name, 'ko'))];
    const buckets = new Map<number, StandingRow[]>();
    for (const row of group) {
      const key = keyOf(criteria[depth], row, group);
      buckets.set(key, [...(buckets.get(key) ?? []), row]);
    }
    return [...buckets.entries()].sort(([a], [b]) => b - a).flatMap(([, rowsAtKey]) => order(rowsAtKey, depth + 1));
  };

  const sorted: StandingRow[] = [];
  for (const tied of order(rows, 0)) {
    const rank = sorted.length + 1;
    for (const row of tied) sorted.push({ ...row, rank });
  }
  return sorted;
}
