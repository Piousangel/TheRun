import { createCollectionAnnouncementRepo } from '@/shared/api/adapters/collection/announcement-repo';
import { Collection } from '@/shared/api/adapters/collection/collection';
import { MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import { buildSeed } from '@/shared/api/adapters/collection/seed';
import { runAnnouncementRepoContract } from '@/shared/api/adapters/contracts/announcement-repo.contract';

const NOW = new Date('2026-09-03T10:00:00+09:00');

runAnnouncementRepoContract(async () => {
  const seed = buildSeed(NOW);
  const storage = new MemoryStorage();
  const repo = createCollectionAnnouncementRepo({
    announcements: new Collection(storage, 'announcements', () => seed.announcements),
    reads: new Collection(storage, 'announcement_reads', () => seed.announcementReads),
    currentUserId: () => 'u-admin',
    now: () => NOW,
  });
  return { repo, currentUserId: 'u-admin' };
});
