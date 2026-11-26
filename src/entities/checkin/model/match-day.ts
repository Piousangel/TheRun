import { kstDateOf } from '@/shared/lib/checkin-time';
import type { Checkin, CheckinStatus } from '@/shared/types/checkin';
import type { VoteSession } from '@/shared/types/vote';

/** 경기 투표(`type:'match'`) 세션의 경기일(KST)을 최근 날짜부터. 같은 날 세션이 둘이면 하나로 친다. */
export function matchDays(sessions: readonly VoteSession[]): { date: string; session: VoteSession }[] {
  const byDate = new Map<string, VoteSession>();
  for (const s of sessions) {
    if (s.type !== 'match') continue;
    const date = kstDateOf(s.event_date);
    if (!byDate.has(date)) byDate.set(date, s);
  }
  return [...byDate.entries()].map(([date, session]) => ({ date, session })).sort((a, b) => b.date.localeCompare(a.date));
}

/** 명단에서 처음 보여줄 경기일: 오늘이 경기일이면 오늘, 아니면 가장 최근 지난 경기일, 없으면 가장 가까운 다음 경기일. */
export function pickRosterDate(dates: readonly string[], today: string): string | null {
  if (dates.includes(today)) return today;
  const past = dates.filter((d) => d < today).sort();
  if (past.length > 0) return past[past.length - 1];
  const future = dates.filter((d) => d > today).sort();
  return future[0] ?? null;
}

export type RosterStatus = CheckinStatus | 'pending';

export interface RosterRow {
  member_id: string;
  /** 투표에서 참석으로 응답했는지 */
  voted: boolean;
  status: RosterStatus;
  checked_in_at: string | null;
  confirmed: boolean;
}

/**
 * 체크인 명단: 참석 투표자 ∪ 체크인한 사람. 투표 = 올 예정, 체크인 = 실제로 옴(스펙 §3).
 * 체크인 시각 순 → 운영진만 확정한 행 → 미확인(이름 순).
 */
export function buildRoster(attendingIds: readonly string[], checkins: readonly Checkin[], nameOf: (id: string) => string): RosterRow[] {
  const byMember = new Map(checkins.map((c) => [c.member_id, c]));
  const ids = [...new Set([...attendingIds, ...checkins.map((c) => c.member_id)])];
  const voted = new Set(attendingIds);
  const rows: RosterRow[] = ids.map((id) => {
    const c = byMember.get(id);
    return {
      member_id: id,
      voted: voted.has(id),
      status: c?.status ?? 'pending',
      checked_in_at: c?.checked_in_at ?? null,
      confirmed: !!c?.confirmed_by,
    };
  });
  const group = (r: RosterRow) => (r.checked_in_at ? 0 : r.status !== 'pending' ? 1 : 2);
  return rows.sort(
    (a, b) =>
      group(a) - group(b) ||
      (a.checked_in_at ?? '').localeCompare(b.checked_in_at ?? '') ||
      nameOf(a.member_id).localeCompare(nameOf(b.member_id), 'ko'),
  );
}

export const ROSTER_STATUS_LABEL: Record<RosterStatus, string> = {
  on_time: '정시',
  late: '지각',
  absent: '결석',
  pending: '미확인',
};
