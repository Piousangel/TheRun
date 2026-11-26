import { computeAttendanceKing } from '@/entities/checkin/model/attendance-king';
import type { Checkin, CheckinStatus } from '@/shared/types/checkin';

const DAYS = ['2026-11-07', '2026-11-14', '2026-11-21', '2026-11-28'];
const names: Record<string, string> = { a: '가', b: '나', c: '다', d: '라', e: '마' };
const nameOf = (id: string) => names[id] ?? id;

function c(member_id: string, date: string, status: CheckinStatus): Checkin {
  return { id: `${member_id}-${date}`, date, member_id, status, checked_in_at: null, confirmed_by: null, updated_at: date };
}

describe('computeAttendanceKing', () => {
  it('정시 → 출석 → 최고 연속 정시 순으로 줄 세우고 연속 정시를 센다', () => {
    const rows = computeAttendanceKing(
      [
        ...DAYS.map((d) => c('a', d, 'on_time')),
        c('b', DAYS[0], 'on_time'), c('b', DAYS[1], 'on_time'), c('b', DAYS[2], 'late'), c('b', DAYS[3], 'on_time'),
        c('c', DAYS[0], 'on_time'), c('c', DAYS[1], 'on_time'), c('c', DAYS[2], 'on_time'),
        c('d', DAYS[0], 'absent'), c('d', DAYS[3], 'late'),
      ],
      DAYS,
      nameOf,
    );
    expect(rows.map((r) => [r.member_id, r.rank, r.on_time, r.late, r.streak, r.best_streak])).toEqual([
      ['a', 1, 4, 0, 4, 4],
      ['b', 2, 3, 1, 1, 2],
      ['c', 3, 3, 0, 0, 3],
      ['d', 4, 0, 1, 0, 0],
    ]);
  });

  it('세 기준이 모두 같으면 공동 순위, 이름 순으로 보여준다', () => {
    const rows = computeAttendanceKing([c('b', DAYS[0], 'on_time'), c('a', DAYS[0], 'on_time')], DAYS, nameOf);
    expect(rows.map((r) => [r.member_id, r.rank])).toEqual([
      ['a', 1],
      ['b', 1],
    ]);
  });

  it('경기일이 아닌 날의 체크인과 결석만 있는 멤버는 빠진다', () => {
    const rows = computeAttendanceKing([c('a', '2026-11-08', 'on_time'), c('e', DAYS[0], 'absent')], DAYS, nameOf);
    expect(rows).toEqual([]);
  });

  it('경기일 순서와 무관하게 날짜순으로 연속을 센다', () => {
    const rows = computeAttendanceKing([c('a', DAYS[2], 'on_time'), c('a', DAYS[3], 'on_time')], [...DAYS].reverse(), nameOf);
    expect(rows[0]).toMatchObject({ streak: 2, best_streak: 2 });
  });
});
