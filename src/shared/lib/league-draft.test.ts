import { draftRound, draftTeamForPick, shuffleDraftOrder, upcomingDraftTeams } from '@/shared/lib/league-draft';

describe('league-draft', () => {
  const order = ['A', 'B', 'C'];

  it('3팀 스네이크: 1-2-3-3-2-1-1-2-3', () => {
    expect(Array.from({ length: 9 }, (_, i) => draftTeamForPick(order, i + 1))).toEqual(['A', 'B', 'C', 'C', 'B', 'A', 'A', 'B', 'C']);
    expect(draftRound(3, 3)).toBe(1);
    expect(draftRound(4, 3)).toBe(2);
  });

  it('4팀 스네이크와 다음 차례', () => {
    expect(upcomingDraftTeams(['A', 'B', 'C', 'D'], 3, 4)).toEqual(['C', 'D', 'D', 'C']);
  });

  it('추첨은 같은 팀을 순서만 바꾼다', () => {
    const shuffled = shuffleDraftOrder(order, () => 0);
    expect([...shuffled].sort()).toEqual(order);
    expect(shuffled).toEqual(['B', 'C', 'A']);
  });
});
