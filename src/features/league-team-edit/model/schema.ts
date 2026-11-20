import { z } from 'zod';

export const leagueTeamSchema = z.object({
  name: z.string().trim().min(1, '팀 이름을 입력해주세요').max(20, '팀 이름은 20자 이내여야 합니다'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '팀 색을 골라주세요'),
  /** 빈 문자열 = 팀장 미정 */
  captain_member_id: z.string(),
});

export type LeagueTeamFormData = z.infer<typeof leagueTeamSchema>;

/**
 * 같은 시즌 안에서 팀 이름·팀장이 겹치지 않는지 본다. 겹치면 오류 문구, 아니면 null.
 * `others`는 지금 편집 중인 팀을 뺀 나머지 팀이다.
 */
export function findTeamConflict(
  data: LeagueTeamFormData,
  others: { name: string; captain_member_id: string | null }[],
): { field: 'name' | 'captain_member_id'; message: string } | null {
  const name = data.name.trim();
  if (others.some((t) => t.name.trim() === name)) return { field: 'name', message: '같은 이름의 팀이 이미 있습니다' };
  if (data.captain_member_id && others.some((t) => t.captain_member_id === data.captain_member_id)) {
    return { field: 'captain_member_id', message: '이미 다른 팀의 팀장입니다' };
  }
  return null;
}
