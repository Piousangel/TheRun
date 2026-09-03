import type { VoteRepo } from '@/shared/api/ports/vote-repo';

export interface VoteRepoFixture {
  repo: VoteRepo;
  /** 시드에 존재하는 진행 중 세션 id와 응답이 없는 멤버 id */
  activeSessionId: string;
  unrespondedMemberId: string;
}

export function runVoteRepoContract(makeRepo: () => Promise<VoteRepoFixture>) {
  describe('VoteRepo contract', () => {
    it('listSessions는 event_date 내림차순, listActiveSessions는 활성만 오름차순', async () => {
      const { repo } = await makeRepo();
      const all = await repo.listSessions();
      for (let i = 1; i < all.length; i += 1) expect(all[i - 1].event_date >= all[i].event_date).toBe(true);
      const active = await repo.listActiveSessions();
      expect(active.every((s) => s.is_active)).toBe(true);
      for (let i = 1; i < active.length; i += 1) expect(active[i - 1].event_date <= active[i].event_date).toBe(true);
    });

    it('createSession은 is_active=true로 만들고 updateSession/removeSession이 동작한다', async () => {
      const { repo } = await makeRepo();
      const created = await repo.createSession({ title: '새 투표', type: 'other', event_date: '2030-01-01T00:00:00.000Z', deadline: '2029-12-31T00:00:00.000Z' });
      expect(created.is_active).toBe(true);
      expect(created.description).toBeNull();
      const closed = await repo.updateSession(created.id, { is_active: false });
      expect(closed.is_active).toBe(false);
      await repo.removeSession(created.id);
      expect(await repo.getSession(created.id)).toBeNull();
    });

    it('respond는 없으면 만들고 있으면 status만 바꾼다(upsert), listResponses는 멤버를 조인한다', async () => {
      const { repo, activeSessionId, unrespondedMemberId } = await makeRepo();
      const before = (await repo.listResponses(activeSessionId)).length;
      const first = await repo.respond({ sessionId: activeSessionId, memberId: unrespondedMemberId, status: 'attending' });
      expect(first.status).toBe('attending');
      const second = await repo.respond({ sessionId: activeSessionId, memberId: unrespondedMemberId, status: 'absent' });
      expect(second.id).toBe(first.id);
      expect(second.status).toBe('absent');
      const after = await repo.listResponses(activeSessionId);
      expect(after).toHaveLength(before + 1);
      const mine = after.find((r) => r.member_id === unrespondedMemberId)!;
      expect(mine.members?.id).toBe(unrespondedMemberId);
    });

    it("type='match' 세션을 만들면 이전 활성 match 세션이 모두 닫힌다(활성 경기 세션은 하나)", async () => {
      const { repo } = await makeRepo();
      const first = await repo.createSession({ title: '경기 A', type: 'match', event_date: '2030-01-01T00:00:00.000Z', deadline: '2029-12-31T00:00:00.000Z' });
      const second = await repo.createSession({ title: '경기 B', type: 'match', event_date: '2030-01-08T00:00:00.000Z', deadline: '2030-01-07T00:00:00.000Z' });
      const active = await repo.listActiveSessions();
      expect(active.filter((s) => s.type === 'match').map((s) => s.id)).toEqual([second.id]);
      expect((await repo.getSession(first.id))?.is_active).toBe(false);
    });

    it("type='match'가 아닌 세션 생성은 활성 match 세션을 닫지 않는다", async () => {
      const { repo, activeSessionId } = await makeRepo();
      await repo.createSession({ title: '회식', type: 'dining', event_date: '2030-01-01T00:00:00.000Z', deadline: '2029-12-31T00:00:00.000Z' });
      expect((await repo.getSession(activeSessionId))?.is_active).toBe(true);
    });

    it('removeSession은 그 세션의 응답도 지운다', async () => {
      const { repo, activeSessionId } = await makeRepo();
      await repo.removeSession(activeSessionId);
      expect(await repo.listResponses(activeSessionId)).toEqual([]);
    });
  });
}
