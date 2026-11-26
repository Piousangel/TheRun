import { formatAvailableWeeks, seasonWeeks, summarizeAvailability } from '@/entities/league/model/availability';
import type { Availability } from '@/shared/types/league';

const row = (member_id: string, weeks: number[]): Availability => ({ id: `s:${member_id}`, season_id: 's', member_id, weeks, updated_at: '' });

describe('참석 가능 주차', () => {
  it('일정이 없으면 기간으로, 있으면 경기일로 주차를 만든다', () => {
    const season = { starts_on: '2026-12-05', ends_on: '2026-12-26' };
    expect(seasonWeeks(season)).toEqual([
      { week: 1, date: '2026-12-05' },
      { week: 2, date: '2026-12-12' },
      { week: 3, date: '2026-12-19' },
      { week: 4, date: '2026-12-26' },
    ]);
    expect(seasonWeeks(season, [{ week: 2, date: '2026-12-13' }, { week: 1, date: '2026-12-06' }])).toEqual([
      { week: 1, date: '2026-12-06' },
      { week: 2, date: '2026-12-13' },
    ]);
  });

  it('표시 문구: 미입력·못 옴·전부 가능·일부', () => {
    expect(formatAvailableWeeks(undefined, 4)).toBe('미입력');
    expect(formatAvailableWeeks(row('a', []), 4)).toBe('못 옴');
    expect(formatAvailableWeeks(row('a', [1, 2, 3, 4]), 4)).toBe('전부 가능');
    expect(formatAvailableWeeks(row('a', [1, 2, 4]), 4)).toBe('1·2·4주');
  });

  it('명단 기준으로 주차별 인원·입력 수·미입력 회원을 센다', () => {
    const rows = [row('a', [1, 2]), row('b', [2]), row('c', []), row('outsider', [1, 2])];
    expect(summarizeAvailability(rows, ['a', 'b', 'c', 'd'], [1, 2, 3])).toEqual({
      perWeek: [{ week: 1, count: 1 }, { week: 2, count: 2 }, { week: 3, count: 0 }],
      entered: 3,
      missing: ['d'],
    });
  });
});
