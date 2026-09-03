import { BrowserSessionStore, IdbStorage, SESSION_COOKIE, SESSION_STORAGE_KEY } from '@/shared/api/adapters/collection/idb-storage';

describe('IdbStorage', () => {
  it('write 후 read, clear 후 undefined', async () => {
    const storage = new IdbStorage();
    expect(await storage.read('members')).toBeUndefined();
    await storage.write('members', [{ id: 'a' }]);
    expect(await storage.read('members')).toEqual([{ id: 'a' }]);
    await storage.clear();
    expect(await storage.read('members')).toBeUndefined();
  });
});

describe('BrowserSessionStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.cookie = `${SESSION_COOKIE}=; max-age=0; path=/`;
  });

  it('set은 localStorage와 쿠키에 같이 쓴다', () => {
    const store = new BrowserSessionStore();
    store.set('u-admin');
    expect(store.get()).toBe('u-admin');
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBe('u-admin');
    expect(document.cookie).toContain(`${SESSION_COOKIE}=u-admin`);
  });

  it('clear는 둘 다 지운다', () => {
    const store = new BrowserSessionStore();
    store.set('u-admin');
    store.clear();
    expect(store.get()).toBeNull();
    expect(document.cookie).not.toContain('u-admin');
  });
});
