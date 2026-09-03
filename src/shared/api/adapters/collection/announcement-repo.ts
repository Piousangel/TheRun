import type { Collection } from '@/shared/api/adapters/collection/collection';
import { newId } from '@/shared/lib/id';
import type { AnnouncementRepo } from '@/shared/api/ports/announcement-repo';
import type { Announcement, AnnouncementRead } from '@/shared/types/announcement';

interface Deps {
  announcements: Collection<Announcement>;
  reads: Collection<AnnouncementRead>;
  currentUserId: () => string | null;
  now: () => Date;
}

export function createCollectionAnnouncementRepo({ announcements, reads, currentUserId, now }: Deps): AnnouncementRepo {
  return {
    async list() {
      return (await announcements.all()).sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return b.publish_at.localeCompare(a.publish_at);
      });
    },
    get(id) {
      return announcements.get(id);
    },
    async create(data) {
      const at = now().toISOString();
      return announcements.insert({
        id: newId(),
        title: data.title,
        body: data.body,
        category: data.category,
        is_pinned: data.is_pinned ?? false,
        publish_at: data.publish_at ?? at,
        created_by: currentUserId(),
        created_at: at,
        updated_at: at,
      });
    },
    update(id, data) {
      return announcements.update(id, { ...data, updated_at: now().toISOString() });
    },
    async remove(id) {
      await announcements.remove(id);
      await reads.replaceAll((await reads.all()).filter((r) => r.announcement_id !== id));
    },
    async listReads(userId) {
      return (await reads.all()).filter((r) => r.user_id === userId);
    },
    async markRead(announcementId, userId) {
      const existing = (await reads.all()).find((r) => r.announcement_id === announcementId && r.user_id === userId);
      if (existing) return existing;
      return reads.insert({ id: newId(), announcement_id: announcementId, user_id: userId, created_at: now().toISOString() });
    },
  };
}
