import { miniGameSchema, toMiniGamePoints, toMiniGameResults } from '@/features/league-minigame/model/schema';

const base = { name: '승부차기', description: '', matchday_id: '', first: '1', second: '', third: '' };

describe('miniGameSchema', () => {
  it('우승 승점만 있으면 통과하고, 이름·우승 승점이 비면 거부한다', () => {
    expect(miniGameSchema.safeParse(base).success).toBe(true);
    expect(miniGameSchema.safeParse({ ...base, name: ' ' }).success).toBe(false);
    expect(miniGameSchema.safeParse({ ...base, first: '' }).success).toBe(false);
    expect(miniGameSchema.safeParse({ ...base, first: '-1' }).success).toBe(false);
  });

  it('2위 없이 3위 승점만 주면 거부한다', () => {
    const r = miniGameSchema.safeParse({ ...base, third: '1' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(['second']);
  });
});

describe('toMiniGamePoints / toMiniGameResults', () => {
  it('빈 칸은 그 등수 승점 없음', () => {
    expect(toMiniGamePoints({ first: '1', second: '', third: '' })).toEqual([1]);
    expect(toMiniGamePoints({ first: '3', second: '2', third: '1' })).toEqual([3, 2, 1]);
  });

  it('등수 없는 팀은 빼고 등수 순으로', () => {
    expect(toMiniGameResults({ a: '2', b: '', c: '1' })).toEqual([{ team_id: 'c', rank: 1 }, { team_id: 'a', rank: 2 }]);
  });
});
