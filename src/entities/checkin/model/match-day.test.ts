import { buildRoster, matchDays, pickRosterDate } from '@/entities/checkin/model/match-day';
import type { Checkin } from '@/shared/types/checkin';
import type { VoteSession } from '@/shared/types/vote';

function session(id: string, type: VoteSession['type'], event_date: string): VoteSession {
  return { id, title: id, description: null, type, event_date, deadline: event_date, is_active: true, created_at: event_date, updated_at: event_date };
}

function ck(member_id: string, status: Checkin['status'], checked_in_at: string | null, confirmed_by: string | null = null): Checkin {
  return { id: member_id, date: '2026-11-28', member_id, status, checked_in_at, confirmed_by, updated_at: '2026-11-28' };
}

describe('matchDays', () => {
  it('경기 투표만 KST 날짜로 바꿔 최근순으로, 같은 날은 하나로', () => {
    const days = matchDays([
      session('a', 'match', '2026-11-21T22:00:00.000Z'), // KST 11-22 07:00
      session('b', 'dining', '2026-11-28T00:30:00.000Z'),
      session('c', 'match', '2026-11-27T22:00:00.000Z'), // KST 11-28
      session('d', 'match', '2026-11-28T01:00:00.000Z'), // KST 11-28 (중복)
    ]);
    expect(days.map((d) => [d.date, d.session.id])).toEqual([
      ['2026-11-28', 'c'],
      ['2026-11-22', 'a'],
    ]);
  });
});

describe('pickRosterDate', () => {
  const dates = ['2026-11-14', '2026-11-21', '2026-11-28'];
  it('오늘이 경기일이면 오늘', () => expect(pickRosterDate(dates, '2026-11-21')).toBe('2026-11-21'));
  it('아니면 가장 최근 지난 경기일', () => expect(pickRosterDate(dates, '2026-11-26')).toBe('2026-11-21'));
  it('지난 경기일이 없으면 다음 경기일', () => expect(pickRosterDate(dates, '2026-11-01')).toBe('2026-11-14'));
  it('경기일이 없으면 null', () => expect(pickRosterDate([], '2026-11-01')).toBeNull());
});

describe('buildRoster', () => {
  const names: Record<string, string> = { a: '가', b: '나', c: '다', d: '라', e: '마' };
  it('참석 투표자 ∪ 체크인한 사람을 체크인 시각 → 운영진 확정 → 미확인 순으로', () => {
    const rows = buildRoster(
      ['e', 'a', 'b', 'c'],
      [ck('b', 'late', '2026-11-27T21:40:00Z'), ck('d', 'on_time', '2026-11-27T21:10:00Z'), ck('c', 'absent', null, 'admin')],
      (id) => names[id],
    );
    expect(rows.map((r) => [r.member_id, r.status, r.voted, r.confirmed])).toEqual([
      ['d', 'on_time', false, false],
      ['b', 'late', true, false],
      ['c', 'absent', true, true],
      ['a', 'pending', true, false],
      ['e', 'pending', true, false],
    ]);
  });
});
