import { computePlayerStats, rankPlayers } from '@/entities/league/model/player-stats';
import type { Appearance, GoalEvent } from '@/shared/types/league';

const goal = (over: Partial<GoalEvent>): GoalEvent => ({
  id: Math.random().toString(36),
  fixture_id: 'f1',
  quarter: 1,
  team_id: 'A',
  scorer_id: null,
  assist_id: null,
  own_goal: false,
  created_by: null,
  created_at: '2026-11-25T00:00:00Z',
  ...over,
});

const app = (fixture_id: string, quarter: number, member_id: string, team_id = 'A'): Appearance => ({
  id: `${fixture_id}-${quarter}-${member_id}`,
  fixture_id,
  quarter,
  team_id,
  member_id,
  created_at: '2026-11-25T00:00:00Z',
});

describe('computePlayerStats', () => {
  it('골·도움·출전 쿼터를 세고, 자책골·득점자 미상은 개인 기록에 넣지 않는다', () => {
    const rows = computePlayerStats(
      [
        goal({ scorer_id: 'kim', assist_id: 'lee' }),
        goal({ scorer_id: 'kim', quarter: 2 }),
        goal({ scorer_id: 'park', own_goal: true }),
        goal({ scorer_id: null, assist_id: null }),
      ],
      [app('f1', 1, 'kim'), app('f1', 2, 'kim'), app('f2', 1, 'kim'), app('f1', 1, 'lee'), app('f1', 1, 'lee')],
    );
    const by = Object.fromEntries(rows.map((r) => [r.member_id, r]));
    expect(by.kim).toMatchObject({ quarters: 3, goals: 2, assists: 0, points: 2 });
    expect(by.lee).toMatchObject({ quarters: 1, goals: 0, assists: 1, points: 1 });
    expect(by.park).toBeUndefined();
  });
});

describe('rankPlayers', () => {
  it('값이 같으면 같은 순위, 0인 선수는 빠지고 같은 값 안에서는 출전 쿼터가 적은 선수가 먼저다', () => {
    const rows = [
      { member_id: 'a', quarters: 6, goals: 2, assists: 0, points: 2 },
      { member_id: 'b', quarters: 3, goals: 2, assists: 1, points: 3 },
      { member_id: 'c', quarters: 3, goals: 1, assists: 0, points: 1 },
      { member_id: 'd', quarters: 9, goals: 0, assists: 2, points: 2 },
    ];
    const ranked = rankPlayers(rows, 'goals', (id) => id);
    expect(ranked.map((r) => [r.member_id, r.rank])).toEqual([['b', 1], ['a', 1], ['c', 3]]);
    expect(rankPlayers(rows, 'points', (id) => id).map((r) => r.member_id)).toEqual(['b', 'a', 'd', 'c']);
  });
});
