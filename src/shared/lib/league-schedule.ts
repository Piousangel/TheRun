export type Pairing = readonly [string, string];

/** 모든 팀 쌍(홈/원정은 입력 순서 기준). */
export function allPairs(teamIds: string[]): Pairing[] {
  const pairs: Pairing[] = [];
  for (let i = 0; i < teamIds.length; i += 1) {
    for (let j = i + 1; j < teamIds.length; j += 1) pairs.push([teamIds[i], teamIds[j]]);
  }
  return pairs;
}

/** 서클 방식 라운드. 팀이 홀수면 휴식(bye)이 생겨 그 쌍은 빠진다. */
function circleRounds(teamIds: string[]): Pairing[][] {
  const slots: (string | null)[] = teamIds.length % 2 === 1 ? [...teamIds, null] : [...teamIds];
  const n = slots.length;
  const rounds: Pairing[][] = [];
  for (let r = 0; r < n - 1; r += 1) {
    const round: Pairing[] = [];
    for (let i = 0; i < n / 2; i += 1) {
      const a = slots[i];
      const b = slots[n - 1 - i];
      if (a && b) round.push([a, b]);
    }
    rounds.push(round);
    slots.splice(1, 0, slots.pop() as string | null);
  }
  return rounds;
}

/**
 * 경기일별 대진. 스펙: 3팀이면 매 경기일 A-B, A-C, B-C 모두(= 한 경기일 3경기).
 * 그 외 팀 수는 서클 라운드를 경기일에 순환 배정한다(4팀이면 경기일당 2경기).
 */
export function buildMatchdayPairings(teamIds: string[], weeks: number): Pairing[][] {
  if (teamIds.length < 2) throw new Error('팀이 2개 이상 있어야 일정을 만들 수 있습니다.');
  if (weeks < 1) throw new Error('경기일 수는 1 이상이어야 합니다.');
  if (teamIds.length === 3) return Array.from({ length: weeks }, () => allPairs(teamIds));
  const rounds = circleRounds(teamIds);
  return Array.from({ length: weeks }, (_, w) => rounds[w % rounds.length]);
}

/** YYYY-MM-DD에 일수를 더한다(UTC 기준이라 타임존·DST 영향 없음). */
export function addDaysIso(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

/**
 * 시즌 주차 수. 일정이 있으면 경기일 수, 없으면 기간(시작일부터 7일 단위, 끝날 포함)으로 센다. 1~12로 자른다.
 * 참석 가능 주차 입력은 일정을 만들기 전에도 할 수 있어야 해서 기간으로도 셀 수 있게 한다.
 */
export function seasonWeekCount(startsOn: string, endsOn: string, matchdayCount = 0): number {
  if (matchdayCount > 0) return matchdayCount;
  const [ys, ms, ds] = startsOn.split('-').map(Number);
  const [ye, me, de] = endsOn.split('-').map(Number);
  const days = Math.round((Date.UTC(ye, me - 1, de) - Date.UTC(ys, ms - 1, ds)) / 86_400_000);
  if (!Number.isFinite(days)) return 1;
  return Math.min(12, Math.max(1, Math.floor(days / 7) + 1));
}
