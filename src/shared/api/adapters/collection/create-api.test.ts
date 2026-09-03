import { createCollectionApi } from '@/shared/api/adapters/collection/create-api';
import { MemorySessionStore, MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';

const NOW = new Date('2026-09-03T10:00:00+09:00');

describe('createCollectionApi', () => {
  it('리포 5개가 같은 저장소를 공유하고 시드가 붙는다', async () => {
    const storage = new MemoryStorage();
    const api = createCollectionApi({ storage, session: new MemorySessionStore(), now: () => NOW });
    expect(await api.members.list()).toHaveLength(20);
    expect(await api.votes.listActiveSessions()).toHaveLength(2);
    expect(await api.matches.list()).toHaveLength(5);
    expect(await api.announcements.list()).toHaveLength(4);
    await api.auth.signInAsDemo('member');
    expect((await api.auth.ensureProfile((await api.auth.getUser())!)).member_id).toBe('m-01');
    // 공지 작성자는 현재 세션 사용자
    const created = await api.announcements.create({ title: 't', body: 'b', category: 'general' });
    expect(created.created_by).toBe('u-member');
  });

  it('storage.clear 후에는 다시 시드된다', async () => {
    const storage = new MemoryStorage();
    const api = createCollectionApi({ storage, session: new MemorySessionStore(), now: () => NOW });
    await api.members.create({ name: 'x', phone_number: '010-0000-0000', stats: { speed: 1, shooting: 1, passing: 1, dribbling: 1, stamina: 1, defense: 1 } });
    expect(await api.members.list()).toHaveLength(21);
    await storage.clear();
    expect(await api.members.list()).toHaveLength(20);
  });

  it('첫 작업이 update여도 시드 캐시가 오염되지 않는다(clear 후 원본 복원)', async () => {
    const storage = new MemoryStorage();
    const api = createCollectionApi({ storage, session: new MemorySessionStore(), now: () => NOW });
    // 저장소가 비어 있는 상태에서 곧바로 update하면 예전 구현은 시드 배열을 직접 변형했다.
    await api.members.update('m-01', { name: '오염된 이름' });
    await storage.clear();
    expect((await api.members.get('m-01'))?.name).toBe('김민준');
  });
});
