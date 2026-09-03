import type { MatchRepo } from '@/shared/api/ports/match-repo';
import type { TeamMatchData } from '@/shared/types/match';

const emptyTeam = (name: string, ids: string[]): TeamMatchData => ({
  name, member_ids: ids, score: 0, players: ids.map((member_id) => ({ member_id, goals: 0, assists: 0, saves: 0, is_mvp: false })),
  goalkeeper_id: null, manager_id: null, substitutions: [], goals_detail: [],
});

export function runMatchRepoContract(makeRepo: () => Promise<{ repo: MatchRepo; seededCount: number }>) {
  describe('MatchRepo contract', () => {
    it('list는 date 내림차순', async () => {
      const { repo, seededCount } = await makeRepo();
      const rows = await repo.list();
      expect(rows).toHaveLength(seededCount);
      for (let i = 1; i < rows.length; i += 1) expect(rows[i - 1].date >= rows[i].date).toBe(true);
    });

    it('create는 status 기본 pending, 타이머 필드 null; update로 진행/종료 기록', async () => {
      const { repo } = await makeRepo();
      const created = await repo.create({
        date: '2030-01-04T07:00:00.000Z', location: '테스트장',
        team_a: emptyTeam('A', ['m-01']), team_b: emptyTeam('B', ['m-02']),
      });
      expect(created).toMatchObject({ status: 'pending', start_time: null, end_time: null, duration: null, notes: null, vote_session_id: null, match_number: null });
      const started = await repo.update(created.id, { status: 'in_progress', start_time: '2030-01-04T07:05:00.000Z', duration: 3000 });
      expect(started.status).toBe('in_progress');
      expect(await repo.get(created.id)).toMatchObject({ duration: 3000 });
      await repo.remove(created.id);
      expect(await repo.get(created.id)).toBeNull();
    });

    it('없는 id update는 reject', async () => {
      const { repo } = await makeRepo();
      await expect(repo.update('nope', { status: 'finished' })).rejects.toThrow();
    });
  });
}
