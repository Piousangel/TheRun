import { z } from 'zod';

export const announcementCreateSchema = z.object({
  title: z.string().min(2, '제목은 2자 이상이어야 합니다.').max(120, '제목은 120자 이하여야 합니다.'),
  body: z.string().min(10, '내용은 10자 이상이어야 합니다.'),
  category: z.enum(['general', 'match', 'schedule', 'urgent']),
  is_pinned: z.boolean().default(false),
});

export type AnnouncementCreateFormData = z.infer<typeof announcementCreateSchema>;
