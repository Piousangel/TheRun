import type { AnnouncementRepo } from '@/shared/api/ports/announcement-repo';

export function runAnnouncementRepoContract(makeRepo: () => Promise<{ repo: AnnouncementRepo; currentUserId: string }>) {
  describe('AnnouncementRepo contract', () => {
    it('list는 고정 먼저, 그 다음 publish_at 내림차순', async () => {
      const { repo } = await makeRepo();
      const rows = await repo.list();
      const firstUnpinned = rows.findIndex((a) => !a.is_pinned);
      expect(rows.slice(0, firstUnpinned).every((a) => a.is_pinned)).toBe(true);
      const unpinned = rows.slice(firstUnpinned);
      for (let i = 1; i < unpinned.length; i += 1) expect(unpinned[i - 1].publish_at >= unpinned[i].publish_at).toBe(true);
    });

    it('create는 created_by를 현재 사용자로, publish_at 기본값을 채운다', async () => {
      const { repo, currentUserId } = await makeRepo();
      const created = await repo.create({ title: '제목', body: '본문', category: 'general' });
      expect(created.created_by).toBe(currentUserId);
      expect(created.is_pinned).toBe(false);
      expect(created.publish_at).toBeTruthy();
      const updated = await repo.update(created.id, { is_pinned: true });
      expect(updated.is_pinned).toBe(true);
      await repo.remove(created.id);
      expect(await repo.get(created.id)).toBeNull();
    });

    it('markRead는 (announcement, user) 기준 upsert, listReads는 그 사용자 것만', async () => {
      const { repo, currentUserId } = await makeRepo();
      const [first] = await repo.list();
      const a = await repo.markRead(first.id, currentUserId);
      const b = await repo.markRead(first.id, currentUserId);
      expect(b.id).toBe(a.id);
      const reads = await repo.listReads(currentUserId);
      expect(reads.filter((r) => r.announcement_id === first.id)).toHaveLength(1);
      expect(await repo.listReads('someone-else')).toEqual([]);
    });
  });
}
