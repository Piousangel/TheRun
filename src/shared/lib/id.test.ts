import { newId } from '@/shared/lib/id';

describe('newId', () => {
  it('crypto.randomUUID가 있으면 그것을 쓴다', () => {
    expect(newId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('보안 컨텍스트가 아니어서 randomUUID가 없어도 고유한 id를 만든다', () => {
    // http://192.168.x.x:3000 처럼 LAN IP로 데모를 열면 randomUUID는 undefined다(getRandomValues는 남는다).
    const real = globalThis.crypto;
    vi.stubGlobal('crypto', { getRandomValues: real.getRandomValues.bind(real) });
    try {
      expect(crypto.randomUUID).toBeUndefined();
      const ids = new Set(Array.from({ length: 500 }, () => newId()));
      expect(ids.size).toBe(500);
      for (const id of ids) expect(id.length).toBeGreaterThanOrEqual(16);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('crypto 전역 자체가 없어도 id를 만든다', () => {
    vi.stubGlobal('crypto', undefined);
    try {
      const ids = new Set(Array.from({ length: 200 }, () => newId()));
      expect(ids.size).toBe(200);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
