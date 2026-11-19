import { seasonCreateSchema } from '@/features/season-create/model/schema';

const valid = {
  name: '2026 겨울 리그',
  starts_on: '2026-11-28',
  ends_on: '2026-12-19',
  quarters_per_match: 3,
  quarter_minutes: 10,
  players_per_side: 6,
  win: 3,
  draw: 1,
  loss: 0,
};

describe('seasonCreateSchema', () => {
  it('기본값 조합은 통과한다', () => {
    expect(seasonCreateSchema.safeParse(valid).success).toBe(true);
  });

  it('숫자 칸이 비어 NaN이면 거부한다', () => {
    expect(seasonCreateSchema.safeParse({ ...valid, quarter_minutes: Number.NaN }).success).toBe(false);
  });

  it('이름이 비면 거부한다', () => {
    expect(seasonCreateSchema.safeParse({ ...valid, name: '  ' }).success).toBe(false);
  });

  it('종료일이 시작일보다 앞이면 ends_on 오류', () => {
    const result = seasonCreateSchema.safeParse({ ...valid, ends_on: '2026-11-01' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['ends_on']);
  });

  it('승점 순서가 뒤집히면 거부한다', () => {
    expect(seasonCreateSchema.safeParse({ ...valid, win: 1, draw: 3 }).success).toBe(false);
  });

  it('쿼터 수 범위를 넘으면 거부한다', () => {
    expect(seasonCreateSchema.safeParse({ ...valid, quarters_per_match: 0 }).success).toBe(false);
    expect(seasonCreateSchema.safeParse({ ...valid, quarters_per_match: 7 }).success).toBe(false);
  });
});
