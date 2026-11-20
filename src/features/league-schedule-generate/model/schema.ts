import { z } from 'zod';

export const scheduleGenerateSchema = z.object({
  first_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '첫 경기일을 선택해주세요'),
  weeks: z
    .number({ invalid_type_error: '경기일 수를 숫자로 입력해주세요' })
    .int('경기일 수는 정수여야 합니다')
    .min(1, '경기일은 1 이상이어야 합니다')
    .max(12, '경기일은 12 이하여야 합니다'),
});

export type ScheduleGenerateFormData = z.infer<typeof scheduleGenerateSchema>;
