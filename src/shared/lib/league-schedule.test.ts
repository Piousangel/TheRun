import { addDaysIso, allPairs, buildMatchdayPairings, seasonWeekCount } from '@/shared/lib/league-schedule';

describe('league-schedule', () => {
  it('3팀이면 매 경기일 3경기, 4주 총 12경기', () => {
    const days = buildMatchdayPairings(['A', 'B', 'C'], 4);
    expect(days).toHaveLength(4);
    days.forEach((d) => expect(d).toEqual([['A', 'B'], ['A', 'C'], ['B', 'C']]));
  });

  it('4팀이면 경기일당 2경기, 3경기일에 모든 쌍이 한 번씩', () => {
    const days = buildMatchdayPairings(['A', 'B', 'C', 'D'], 3);
    days.forEach((d) => expect(d).toHaveLength(2));
    const keys = days.flat().map(([a, b]) => [a, b].sort().join('-')).sort();
    expect(keys).toEqual(allPairs(['A', 'B', 'C', 'D']).map(([a, b]) => `${a}-${b}`).sort());
  });

  it('한 경기일에 같은 팀이 두 번 나오지 않는다(4·6팀)', () => {
    for (const ids of [['A', 'B', 'C', 'D'], ['A', 'B', 'C', 'D', 'E', 'F']]) {
      buildMatchdayPairings(ids, ids.length - 1).forEach((d) => {
        const used = d.flat();
        expect(new Set(used).size).toBe(used.length);
      });
    }
  });

  it('팀 2개 미만·경기일 0은 거부', () => {
    expect(() => buildMatchdayPairings(['A'], 4)).toThrow();
    expect(() => buildMatchdayPairings(['A', 'B'], 0)).toThrow();
  });

  it('addDaysIso는 월 경계를 넘는다', () => {
    expect(addDaysIso('2026-11-28', 7)).toBe('2026-12-05');
  });
});

describe('seasonWeekCount', () => {
  it('일정이 있으면 경기일 수, 없으면 기간을 7일 단위로 센다(1~12)', () => {
    expect(seasonWeekCount('2026-12-05', '2026-12-26', 3)).toBe(3);
    expect(seasonWeekCount('2026-12-05', '2026-12-26')).toBe(4);
    expect(seasonWeekCount('2026-12-05', '2026-12-05')).toBe(1);
    expect(seasonWeekCount('2026-12-05', '2026-12-01')).toBe(1);
    expect(seasonWeekCount('2026-01-01', '2026-12-31')).toBe(12);
  });
});
