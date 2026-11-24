import { computeStandings, fixtureScore } from '@/entities/league/model/standings';
import type { Fixture, GoalEvent, LeagueTeam, Season } from '@/shared/types/league';

const season: Season = {
  id: 's', name: 's', starts_on: '2026-12-05', ends_on: '2026-12-26', status: 'active',
  quarters_per_match: 3, quarter_minutes: 10, players_per_side: 6,
  points: { win: 3, draw: 1, loss: 0 }, tiebreakers: ['goal_diff', 'goals_for', 'head_to_head'], mvp_method: 'member_vote',
  created_at: '', updated_at: '',
};
const team = (id: string): LeagueTeam => ({ id, season_id: 's', name: `${id}팀`, color: '#000', captain_member_id: null, created_at: '' });
const A = team('A');
const B = team('B');
const C = team('C');
const fx = (id: string, home: string, away: string, status: Fixture['status'] = 'final'): Fixture => ({
  id, matchday_id: 'd1', order: 1, home_team_id: home, away_team_id: away, status,
});
let n = 0;
const goals = (fixtureId: string, teamId: string, count: number): GoalEvent[] =>
  Array.from({ length: count }, () => ({
    id: `g${n++}`, fixture_id: fixtureId, quarter: 1, team_id: teamId, scorer_id: null, assist_id: null, own_goal: false, created_by: null, created_at: '',
  }));

describe('fixtureScore', () => {
  it('팀별 골 수를 센다', () => {
    const f = fx('f1', 'A', 'B');
    expect(fixtureScore(f, [...goals('f1', 'A', 2), ...goals('f1', 'B', 1), ...goals('f2', 'A', 5)])).toEqual({ home: 2, away: 1 });
  });
});

describe('computeStandings', () => {
  it('끝난 경기만 세고 승점 → 득실차 순으로 정렬한다', () => {
    const fixtures = [fx('f1', 'A', 'B'), fx('f2', 'A', 'C'), fx('f3', 'B', 'C'), fx('f4', 'B', 'C', 'live')];
    const g = [...goals('f1', 'A', 3), ...goals('f1', 'B', 1), ...goals('f2', 'A', 1), ...goals('f2', 'C', 1), ...goals('f3', 'B', 2), ...goals('f4', 'C', 9)];
    const rows = computeStandings(season, [A, B, C], fixtures, g);
    expect(rows.map((r) => [r.team.id, r.rank, r.points, r.played, r.goal_diff])).toEqual([
      ['A', 1, 4, 2, 2],
      ['B', 2, 3, 2, 0],
      ['C', 3, 1, 2, -2],
    ]);
    expect(rows[0]).toMatchObject({ won: 1, drawn: 1, lost: 0, goals_for: 4, goals_against: 2 });
  });

  it('시즌 승점 설정을 따른다', () => {
    const custom = { ...season, points: { win: 2, draw: 1, loss: 0 } };
    const rows = computeStandings(custom, [A, B], [fx('f1', 'A', 'B')], goals('f1', 'A', 1));
    expect(rows[0]).toMatchObject({ team: A, points: 2 });
  });

  it('승점·득실차·다득점이 같으면 승자승으로 가른다', () => {
    // A-B 1:0, B-C 1:0, C-A 1:0 → 모두 3점·득실 0·득점 1 → 승자승도 순환이라 같은 순위
    const cyc = [fx('f1', 'A', 'B'), fx('f2', 'B', 'C'), fx('f3', 'C', 'A')];
    const g = [...goals('f1', 'A', 1), ...goals('f2', 'B', 1), ...goals('f3', 'C', 1)];
    expect(computeStandings(season, [A, B, C], cyc, g).map((r) => r.rank)).toEqual([1, 1, 1]);

    // 승자승을 득실차보다 앞에 두면 승점이 같은 A·B는 맞대결 승자 A가 앞선다
    const h2hFirst = { ...season, tiebreakers: ['head_to_head', 'goal_diff'] as Season['tiebreakers'] };
    // A: B에 1:0 승, C와 1승 1패 → 6점, 득실 +1 / B: A에 패, C에 5:0 두 번 → 6점, 득실 +9
    const two = [fx('f1', 'A', 'B'), fx('f2', 'A', 'C'), fx('f3', 'C', 'A'), fx('f4', 'B', 'C'), fx('f5', 'B', 'C')];
    const g2 = [...goals('f1', 'A', 1), ...goals('f2', 'A', 1), ...goals('f3', 'C', 1), ...goals('f4', 'B', 5), ...goals('f5', 'B', 5)];
    const rows = computeStandings(h2hFirst, [A, B, C], two, g2);
    const a = rows.find((r) => r.team.id === 'A')!;
    const b = rows.find((r) => r.team.id === 'B')!;
    expect(a.points).toBe(b.points);
    expect(a.rank).toBeLessThan(b.rank);
    // 기본(득실차 먼저)이면 B가 앞선다
    const byDefault = computeStandings(season, [A, B, C], two, g2).map((r) => r.team.id);
    expect(byDefault.indexOf('B')).toBeLessThan(byDefault.indexOf('A'));
  });

  it('경기가 없으면 모두 0점 같은 순위, 이름순', () => {
    const rows = computeStandings(season, [B, A], [], []);
    expect(rows.map((r) => [r.team.id, r.rank])).toEqual([['A', 1], ['B', 1]]);
  });
});
