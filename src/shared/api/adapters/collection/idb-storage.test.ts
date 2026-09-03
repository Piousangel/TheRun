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
    document.cookie = 'other-therun-session=; max-age=0; path=/';
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

  it('읽기의 진실 원천은 쿠키다 — 쿠키만 있으면 로그인 상태로 본다', () => {
    document.cookie = `${SESSION_COOKIE}=u-member; path=/`;
    expect(new BrowserSessionStore().get()).toBe('u-member');
  });

  it('쿠키가 만료돼 사라지면 localStorage가 남아 있어도 비로그인이다', () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, 'u-admin');
    expect(new BrowserSessionStore().get()).toBeNull();
  });

  it('다른 쿠키가 섞여 있어도 세션 쿠키만 골라 읽는다', () => {
    document.cookie = 'other-therun-session=hacked; path=/';
    document.cookie = `${SESSION_COOKIE}=u%2Dsuper; path=/`;
    expect(new BrowserSessionStore().get()).toBe('u-super');
  });
});
