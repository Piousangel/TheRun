import type { MemberRepo } from '@/shared/api/ports/member-repo';

const STATS = { speed: 50, shooting: 50, passing: 50, dribbling: 50, stamina: 50, defense: 50 };

/** 모든 MemberRepo 구현이 통과해야 하는 계약. supabase 어댑터도 나중에 같은 함수를 돌린다. */
export function runMemberRepoContract(makeRepo: () => Promise<{ repo: MemberRepo; seededCount: number }>) {
  describe('MemberRepo contract', () => {
    it('list는 시드 개수만큼, created_at 내림차순', async () => {
      const { repo, seededCount } = await makeRepo();
      const rows = await repo.list();
      expect(rows).toHaveLength(seededCount);
      for (let i = 1; i < rows.length; i += 1) {
        expect(rows[i - 1].created_at >= rows[i].created_at).toBe(true);
      }
    });

    it('create → get → update → remove', async () => {
      const { repo } = await makeRepo();
      const created = await repo.create({ name: '신규', phone_number: '010-1111-2222', stats: STATS });
      expect(created.id).toBeTruthy();
      expect(created.profile_photo).toBeNull();
      expect(await repo.get(created.id)).toMatchObject({ name: '신규' });
      const updated = await repo.update(created.id, { name: '수정' });
      expect(updated.name).toBe('수정');
      expect(updated.updated_at >= created.updated_at).toBe(true);
      await repo.remove(created.id);
      expect(await repo.get(created.id)).toBeNull();
    });

    it('없는 id는 get null, update는 reject', async () => {
      const { repo } = await makeRepo();
      expect(await repo.get('nope')).toBeNull();
      await expect(repo.update('nope', { name: 'x' })).rejects.toThrow();
    });
  });
}
