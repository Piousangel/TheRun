import { z } from 'zod';

export const memberEditSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(100, '이름은 100자 이내여야 합니다'),
  phone_number: z.string().regex(/^010-\d{4}-\d{4}$/, '010-1234-5678 형식으로 입력해주세요'),
  profile_photo: z.any().optional().nullable(),
  stats: z.object({
    speed: z.number().min(0).max(100),
    shooting: z.number().min(0).max(100),
    passing: z.number().min(0).max(100),
    dribbling: z.number().min(0).max(100),
    stamina: z.number().min(0).max(100),
    defense: z.number().min(0).max(100),
  }),
});

export type MemberEditFormData = z.infer<typeof memberEditSchema>;
