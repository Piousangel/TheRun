export type AnnouncementCategory = 'general' | 'match' | 'schedule' | 'urgent';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  is_pinned: boolean;
  publish_at: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementRead {
  id: string;
  announcement_id: string;
  user_id: string;
  created_at: string;
}

export interface CreateAnnouncementData {
  title: string;
  body: string;
  category: AnnouncementCategory;
  is_pinned?: boolean;
  publish_at?: string;
}

export type UpdateAnnouncementData = Partial<CreateAnnouncementData>;
