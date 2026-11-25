import type { Appearance, GoalEvent } from '@/shared/types/league';

/** 개인 기록은 저장하지 않고 골·출전 이벤트에서 계산한다(스펙 §2.2). */
export interface PlayerStatRow {
  member_id: string;
  /** 출전한 쿼터 수(경기·쿼터 단위로 한 번) */
  quarters: number;
  /** 자책골은 넣지 않는다 */
  goals: number;
  assists: number;
  /** 공격포인트 = 골 + 도움 */
  points: number;
}

export function computePlayerStats(goals: readonly GoalEvent[], appearances: readonly Appearance[]): PlayerStatRow[] {
  const rows = new Map<string, PlayerStatRow>();
  const row = (memberId: string) => {
    let r = rows.get(memberId);
    if (!r) {
      r = { member_id: memberId, quarters: 0, goals: 0, assists: 0, points: 0 };
      rows.set(memberId, r);
    }
    return r;
  };

  const played = new Set<string>();
  for (const a of appearances) {
    const key = `${a.fixture_id}:${a.quarter}:${a.member_id}`;
    if (played.has(key)) continue;
    played.add(key);
    row(a.member_id).quarters += 1;
  }
  for (const g of goals) {
    if (g.scorer_id && !g.own_goal) row(g.scorer_id).goals += 1;
    if (g.assist_id && !g.own_goal) row(g.assist_id).assists += 1;
  }
  for (const r of rows.values()) r.points = r.goals + r.assists;
  return [...rows.values()];
}

export type PlayerStatKey = 'goals' | 'assists' | 'points';

export interface RankedPlayer extends PlayerStatRow {
  rank: number;
}

/**
 * `key`가 큰 순서로 줄 세운다. 0인 선수는 빼고, 같은 값이면 같은 순위다.
 * 같은 값 안에서는 출전 쿼터가 적은 선수(효율), 그다음 이름 순으로 보여준다.
 */
export function rankPlayers(rows: readonly PlayerStatRow[], key: PlayerStatKey, nameOf: (id: string) => string): RankedPlayer[] {
  const sorted = rows
    .filter((r) => r[key] > 0)
    .sort((a, b) => b[key] - a[key] || a.quarters - b.quarters || nameOf(a.member_id).localeCompare(nameOf(b.member_id), 'ko'));
  let rank = 0;
  return sorted.map((r, i) => {
    if (i === 0 || sorted[i - 1][key] !== r[key]) rank = i + 1;
    return { ...r, rank };
  });
}
