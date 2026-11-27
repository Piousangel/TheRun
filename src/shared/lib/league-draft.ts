/** 스네이크 드래프트 계산(스펙 §2.1: 1-2-3-3-2-1 반복). 어댑터와 화면이 같은 규칙을 쓴다. */

/** pickNo(1부터)의 라운드(1부터) */
export function draftRound(pickNo: number, teamCount: number): number {
  return Math.ceil(pickNo / teamCount);
}

/** pickNo(1부터)에 뽑는 팀. 홀수 라운드는 order 순, 짝수 라운드는 거꾸로 */
export function draftTeamForPick(order: string[], pickNo: number): string {
  const n = order.length;
  const round = draftRound(pickNo, n);
  const index = (pickNo - 1) % n;
  return round % 2 === 1 ? order[index] : order[n - 1 - index];
}

/** Fisher–Yates 추첨. random은 테스트에서 고정한다 */
export function shuffleDraftOrder(teamIds: string[], random: () => number = Math.random): string[] {
  const out = [...teamIds];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 다음 픽부터 count개 차례(팀 id) — '다음 차례' 표시용 */
export function upcomingDraftTeams(order: string[], nextPickNo: number, count: number): string[] {
  return Array.from({ length: count }, (_, i) => draftTeamForPick(order, nextPickNo + i));
}
