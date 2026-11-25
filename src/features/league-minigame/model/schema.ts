import { z } from 'zod';

const pointField = z.string().trim().regex(/^\d{0,2}$/, '0~99 사이 숫자');

/** 미니게임 만들기. 승점 칸은 문자열(빈 칸 = 그 등수는 승점 없음) */
export const miniGameSchema = z
  .object({
    name: z.string().trim().min(1, '종목 이름을 입력해주세요').max(20, '종목 이름은 20자 이내여야 합니다'),
    description: z.string().trim().max(60, '설명은 60자 이내여야 합니다'),
    /** 빈 문자열 = 경기일 미정 */
    matchday_id: z.string(),
    first: pointField.refine((v) => v !== '', '우승 승점을 입력해주세요'),
    second: pointField,
    third: pointField,
  })
  .refine((d) => !(d.third !== '' && d.second === ''), { path: ['second'], message: '3위 승점을 주려면 2위 승점도 정해주세요' });

export type MiniGameFormData = z.infer<typeof miniGameSchema>;

/** 폼 승점 칸 → [1위, 2위?, 3위?] */
export function toMiniGamePoints(data: Pick<MiniGameFormData, 'first' | 'second' | 'third'>): number[] {
  const points = [Number(data.first)];
  if (data.second !== '') points.push(Number(data.second));
  if (data.third !== '' && data.second !== '') points.push(Number(data.third));
  return points;
}

/** 팀별 등수 선택(빈 문자열 = 등수 없음) → 결과 배열 */
export function toMiniGameResults(ranks: Record<string, string>): { team_id: string; rank: number }[] {
  return Object.entries(ranks)
    .filter(([, rank]) => rank !== '')
    .map(([team_id, rank]) => ({ team_id, rank: Number(rank) }))
    .sort((a, b) => a.rank - b.rank);
}
