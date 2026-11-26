import type { Checkin } from '@/shared/types/checkin';

/** 출석왕은 저장하지 않고 체크인에서 계산한다(스펙 §3, D-13). */
export interface AttendanceRow {
  member_id: string;
  /** 06:30까지 체크인한 경기일 수 */
  on_time: number;
  /** 06:30 뒤 체크인한 경기일 수 */
  late: number;
  /** 정시 + 지각 */
  attended: number;
  /** 가장 최근 경기일부터 거꾸로 이어진 연속 정시 */
  streak: number;
  /** 시즌 중 가장 길었던 연속 정시 */
  best_streak: number;
  rank: number;
}

/**
 * `dates`(경기일, 지난 날짜만)의 체크인으로 출석왕 순위를 만든다.
 * - 정시 많은 순 → 출석(정시+지각) 많은 순 → 최고 연속 정시 순. 셋이 같으면 같은 순위.
 * - 연속 정시는 경기일 순서대로 센다. 지각·결석·기록 없음은 연속을 끊는다.
 * - 경기일에 속하지 않는 체크인은 무시한다. 한 번도 출석하지 않은 멤버는 빠진다.
 */
export function computeAttendanceKing(checkins: readonly Checkin[], dates: readonly string[], nameOf: (id: string) => string): AttendanceRow[] {
  const days = [...new Set(dates)].sort();
  const daySet = new Set(days);
  const byMember = new Map<string, Map<string, Checkin['status']>>();
  for (const c of checkins) {
    if (!daySet.has(c.date)) continue;
    let m = byMember.get(c.member_id);
    if (!m) byMember.set(c.member_id, (m = new Map()));
    m.set(c.date, c.status);
  }

  const rows: Omit<AttendanceRow, 'rank'>[] = [];
  for (const [memberId, statusByDate] of byMember) {
    let onTime = 0;
    let late = 0;
    let run = 0;
    let best = 0;
    for (const day of days) {
      const s = statusByDate.get(day);
      if (s === 'on_time') {
        onTime += 1;
        run += 1;
        best = Math.max(best, run);
      } else {
        if (s === 'late') late += 1;
        run = 0;
      }
    }
    if (onTime + late === 0) continue;
    rows.push({ member_id: memberId, on_time: onTime, late, attended: onTime + late, streak: run, best_streak: best });
  }

  const cmp = (a: Omit<AttendanceRow, 'rank'>, b: Omit<AttendanceRow, 'rank'>) =>
    b.on_time - a.on_time || b.attended - a.attended || b.best_streak - a.best_streak;
  rows.sort((a, b) => cmp(a, b) || nameOf(a.member_id).localeCompare(nameOf(b.member_id), 'ko'));
  let rank = 0;
  return rows.map((r, i) => {
    if (i === 0 || cmp(rows[i - 1], r) !== 0) rank = i + 1;
    return { ...r, rank };
  });
}
