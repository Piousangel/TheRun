import { scheduleGenerateSchema } from '@/features/league-schedule-generate/model/schema';

describe('scheduleGenerateSchema', () => {
  it('기본 4주는 통과한다', () => {
    expect(scheduleGenerateSchema.safeParse({ first_date: '2026-11-28', weeks: 4 }).success).toBe(true);
  });

  it('0주·13주·NaN·빈 날짜는 거부한다', () => {
    expect(scheduleGenerateSchema.safeParse({ first_date: '2026-11-28', weeks: 0 }).success).toBe(false);
    expect(scheduleGenerateSchema.safeParse({ first_date: '2026-11-28', weeks: 13 }).success).toBe(false);
    expect(scheduleGenerateSchema.safeParse({ first_date: '2026-11-28', weeks: Number.NaN }).success).toBe(false);
    expect(scheduleGenerateSchema.safeParse({ first_date: '', weeks: 4 }).success).toBe(false);
  });
});
