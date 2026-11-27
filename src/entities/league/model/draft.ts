import { draftRound, draftTeamForPick, upcomingDraftTeams } from '@/shared/lib/league-draft';
import type { Draft, LeagueTeam } from '@/shared/types/league';
import type { MemberStats } from '@/shared/types/member';

export interface DraftView {
  /** 다음 픽 번호(1부터). 끝난 드래프트면 마지막 픽 + 1 */
  nextPickNo: number;
  round: number;
  /** 지금 차례인 팀. 끝났거나 시작 전이면 null */
  onClockTeamId: string | null;
  /** 지금 차례 다음 count개 */
  upcoming: string[];
  /** 팀별 명단: 팀장(있으면) 먼저, 그다음 픽 순서 */
  rosters: Record<string, string[]>;
  /** 뽑혔거나 팀장인 회원 */
  taken: Set<string>;
}

/** 드래프트 화면에 필요한 계산. draft가 없으면 팀장만 명단에 있다 */
export function buildDraftView(draft: Draft | null | undefined, teams: Pick<LeagueTeam, 'id' | 'captain_member_id'>[], upcomingCount = 3): DraftView {
  const rosters: Record<string, string[]> = {};
  const taken = new Set<string>();
  for (const team of teams) {
    rosters[team.id] = team.captain_member_id ? [team.captain_member_id] : [];
    if (team.captain_member_id) taken.add(team.captain_member_id);
  }
  for (const pick of draft?.picks ?? []) {
    (rosters[pick.team_id] ??= []).push(pick.member_id);
    taken.add(pick.member_id);
  }
  const nextPickNo = (draft?.picks.length ?? 0) + 1;
  const open = draft?.status === 'open' && draft.order.length > 0;
  return {
    nextPickNo,
    round: open ? draftRound(nextPickNo, draft.order.length) : 0,
    onClockTeamId: open ? draftTeamForPick(draft.order, nextPickNo) : null,
    upcoming: open ? upcomingDraftTeams(draft.order, nextPickNo + 1, upcomingCount) : [],
    rosters,
    taken,
  };
}

/** 스탯 6종 합(0~600). 드래프트 선수 카드 정렬용 */
export function totalStats(stats: MemberStats): number {
  return stats.speed + stats.shooting + stats.passing + stats.dribbling + stats.stamina + stats.defense;
}
