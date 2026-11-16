import type { AuditRepo } from '@/shared/api/ports/audit-repo';

export function runAuditRepoContract(makeRepo: () => Promise<{ repo: AuditRepo }>) {
  describe('AuditRepo contract', () => {
    it('기록을 남기면 대상별로 최신순으로 조회된다', async () => {
      const { repo } = await makeRepo();
      const first = await repo.record({ entity: 'goal', entity_id: 'g1', action: 'create', after: { scorer: 'm1' }, actor_id: 'u1' });
      const second = await repo.record({
        entity: 'goal', entity_id: 'g1', action: 'update', before: { scorer: 'm1' }, after: { scorer: 'm2' }, actor_id: 'u2',
      });
      await repo.record({ entity: 'goal', entity_id: 'g2', action: 'delete', before: { scorer: 'm3' }, actor_id: 'u1' });

      expect(first).toMatchObject({ before: null, after: { scorer: 'm1' }, actor_id: 'u1' });
      expect((await repo.listFor('goal', 'g1')).map((l) => l.id)).toEqual([second.id, first.id]);
      expect(await repo.listFor('goal', 'g2')).toHaveLength(1);
      expect(await repo.listFor('checkin', 'g1')).toEqual([]);
    });

    it('기록은 추가 전용이다 — 수정·삭제 메서드가 없다', async () => {
      const { repo } = await makeRepo();
      expect(Object.keys(repo).sort()).toEqual(['listFor', 'record']);
    });
  });
}
