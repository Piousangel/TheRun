import { z } from 'zod';

export const voteCreateSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(200, '제목은 200자 이내여야 합니다'),
  description: z.string().optional(),
  type: z.enum(['match', 'dining', 'outing', 'other'], {
    required_error: '투표 유형을 선택해주세요',
  }),
  event_date: z.string().min(1, '이벤트 날짜를 선택해주세요'),
  deadline: z.string().min(1, '마감 시간을 선택해주세요'),
});

export type VoteCreateFormData = z.infer<typeof voteCreateSchema>;
