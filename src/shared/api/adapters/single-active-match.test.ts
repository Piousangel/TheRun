import { withSingleActiveMatchSession } from '@/shared/api/adapters/single-active-match';
import type { VoteRepo } from '@/shared/api/ports/vote-repo';
import type { VoteSession } from '@/shared/types/vote';

function session(id: string, type: VoteSession['type'], isActive: boolean): VoteSession {
  return {
    id,
    title: id,
    description: null,
    type,
    event_date: `2030-01-0${id.length}T00:00:00.000Z`,
    deadline: '2029-12-31T00:00:00.000Z',
    is_active: isActive,
    created_at: '2029-12-01T00:00:00.000Z',
    updated_at: '2029-12-01T00:00:00.000Z',
  };
}

/** updateSession이 동시에 몇 개까지 겹쳐서 실행됐는지 센다(어댑터의 read-modify-write 유실 재현용). */
function fakeRepo(rows: VoteSession[]) {
  let inFlight = 0;
  let maxInFlight = 0;
  const repo: VoteRepo = {
    async listSessions() { return rows; },
    async listActiveSessions() { return rows.filter((r) => r.is_active); },
    async getSession(id) { return rows.find((r) => r.id === id) ?? null; },
    async createSession(data) {
      const created = { ...session(`new-${rows.length}`, data.type, true), title: data.title, event_date: data.event_date, deadline: data.deadline };
      rows.push(created);
      return created;
    },
    async updateSession(id, data) {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 0));
      const row = rows.find((r) => r.id === id)!;
      Object.assign(row, data);
      inFlight -= 1;
      return row;
    },
    async removeSession() {},
    async listResponses() { return []; },
    async respond() { throw new Error('사용하지 않음'); },
  };
  return { repo, rows, maxInFlight: () => maxInFlight };
}

const MATCH_INPUT = { title: '새 경기', type: 'match' as const, event_date: '2030-02-01T00:00:00.000Z', deadline: '2030-01-31T00:00:00.000Z' };

describe('withSingleActiveMatchSession', () => {
  it('활성 match 세션이 여럿이면 모두 닫고 새 세션을 만든다', async () => {
    const { repo, rows } = fakeRepo([session('a', 'match', true), session('b', 'match', true), session('c', 'dining', true)]);
    await withSingleActiveMatchSession(repo).createSession(MATCH_INPUT);
    expect(rows.find((r) => r.id === 'a')?.is_active).toBe(false);
    expect(rows.find((r) => r.id === 'b')?.is_active).toBe(false);
    expect(rows.find((r) => r.id === 'c')?.is_active).toBe(true);
    expect(rows.filter((r) => r.type === 'match' && r.is_active)).toHaveLength(1);
  });

  it('이전 세션을 순차로 닫는다(동시 쓰기는 서로를 덮어쓴다)', async () => {
    const fake = fakeRepo([session('a', 'match', true), session('b', 'match', true)]);
    await withSingleActiveMatchSession(fake.repo).createSession(MATCH_INPUT);
    expect(fake.maxInFlight()).toBe(1);
  });

  it('match가 아닌 타입은 아무 세션도 닫지 않는다', async () => {
    const { repo, rows, maxInFlight } = fakeRepo([session('a', 'match', true)]);
    await withSingleActiveMatchSession(repo).createSession({ ...MATCH_INPUT, type: 'dining' });
    expect(rows.find((r) => r.id === 'a')?.is_active).toBe(true);
    expect(maxInFlight()).toBe(0);
  });

  it('나머지 메서드는 감싼 리포로 그대로 위임한다', async () => {
    const { repo } = fakeRepo([session('a', 'match', true)]);
    const wrapped = withSingleActiveMatchSession(repo);
    expect((await wrapped.getSession('a'))?.id).toBe('a');
    expect(await wrapped.listActiveSessions()).toHaveLength(1);
  });
});
