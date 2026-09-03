import type {
  Announcement,
  AnnouncementRead,
  CreateAnnouncementData,
  UpdateAnnouncementData,
} from '@/shared/types/announcement';

export interface AnnouncementRepo {
  /** is_pinned 내림차순, publish_at 내림차순 */
  list(): Promise<Announcement[]>;
  get(id: string): Promise<Announcement | null>;
  /** created_by = 현재 로그인 사용자 id */
  create(data: CreateAnnouncementData): Promise<Announcement>;
  update(id: string, data: UpdateAnnouncementData): Promise<Announcement>;
  remove(id: string): Promise<void>;
  listReads(userId: string): Promise<AnnouncementRead[]>;
  /** (announcement_id, user_id) 기준 upsert */
  markRead(announcementId: string, userId: string): Promise<AnnouncementRead>;
}
