import type { AuditRepo } from '@/shared/api/ports/audit-repo';
import type { CheckinRepo } from '@/shared/api/ports/checkin-repo';

/** setNow: 테스트가 현재 시각(KST 기준 문자열 "YYYY-MM-DDTHH:mm")을 바꾼다. */
export function runCheckinRepoContract(
  makeRepo: () => Promise<{ repo: CheckinRepo; audit: AuditRepo; setNow: (kstIso: string) => void }>,
) {
  const DATE = '2026-11-21';

  describe('CheckinRepo contract', () => {
    it('06:30까지 체크인하면 정시, 그 뒤면 지각', async () => {
      const { repo, setNow } = await makeRepo();
      setNow(`${DATE}T06:10`);
      expect((await repo.checkIn({ date: DATE, member_id: 'm1' })).status).toBe('on_time');
      setNow(`${DATE}T06:45`);
      expect((await repo.checkIn({ date: DATE, member_id: 'm2' })).status).toBe('late');
      expect((await repo.listByDate(DATE)).map((c) => c.member_id)).toEqual(['m1', 'm2']);
    });

    it('같은 날 두 번 체크인해도 첫 기록이 유지된다(멱등)', async () => {
      const { repo, setNow } = await makeRepo();
      setNow(`${DATE}T06:10`);
      const first = await repo.checkIn({ date: DATE, member_id: 'm1' });
      setNow(`${DATE}T07:00`);
      const again = await repo.checkIn({ date: DATE, member_id: 'm1' });
      expect(again.id).toBe(first.id);
      expect(again.status).toBe('on_time');
      expect(await repo.listByDate(DATE)).toHaveLength(1);
    });

    it('체크인 창(05:30~08:00) 밖이면 거부한다', async () => {
      const { repo, setNow } = await makeRepo();
      setNow(`${DATE}T05:00`);
      await expect(repo.checkIn({ date: DATE, member_id: 'm1' })).rejects.toThrow();
      setNow(`${DATE}T09:00`);
      await expect(repo.checkIn({ date: DATE, member_id: 'm1' })).rejects.toThrow();
      setNow('2026-11-22T06:00');
      await expect(repo.checkIn({ date: DATE, member_id: 'm1' })).rejects.toThrow();
      expect(await repo.listByDate(DATE)).toEqual([]);
    });

    it('운영진 확정은 행이 없으면 만들고 있으면 고치며, 둘 다 감사 로그가 남는다', async () => {
      const { repo, audit, setNow } = await makeRepo();
      setNow(`${DATE}T06:45`);
      const own = await repo.checkIn({ date: DATE, member_id: 'm1' });
      expect(own.status).toBe('late');

      const fixed = await repo.confirm({ date: DATE, member_id: 'm1', status: 'on_time', actor_id: 'admin' });
      expect(fixed).toMatchObject({ id: own.id, status: 'on_time', confirmed_by: 'admin' });

      const absent = await repo.confirm({ date: DATE, member_id: 'm2', status: 'absent', actor_id: 'admin' });
      expect(absent).toMatchObject({ status: 'absent', checked_in_at: null, confirmed_by: 'admin' });

      const history = await audit.listFor('checkin', own.id);
      expect(history.map((l) => l.action)).toEqual(['update', 'create']);
      expect(history[0]).toMatchObject({ actor_id: 'admin', before: { status: 'late' }, after: { status: 'on_time' } });
      expect((await audit.listFor('checkin', absent.id))[0]).toMatchObject({ action: 'create', actor_id: 'admin' });
    });

    it('멤버별 이력은 날짜 내림차순', async () => {
      const { repo } = await makeRepo();
      await repo.confirm({ date: '2026-11-14', member_id: 'm1', status: 'on_time', actor_id: 'a' });
      await repo.confirm({ date: '2026-11-21', member_id: 'm1', status: 'late', actor_id: 'a' });
      await repo.confirm({ date: '2026-11-21', member_id: 'm2', status: 'on_time', actor_id: 'a' });
      expect((await repo.listByMember('m1')).map((c) => c.date)).toEqual(['2026-11-21', '2026-11-14']);
    });
  });
}
