import { __setApiForTests, getApi, getDataAdapter } from '@/shared/api/client';

describe('client', () => {
  afterEach(() => {
    __setApiForTests(null);
    delete process.env.NEXT_PUBLIC_DATA_ADAPTER;
  });

  it('기본 어댑터는 local', () => {
    expect(getDataAdapter()).toBe('local');
  });

  it('env로 supabase를 고를 수 있다', () => {
    process.env.NEXT_PUBLIC_DATA_ADAPTER = 'supabase';
    expect(getDataAdapter()).toBe('supabase');
  });

  it('local에서 getApi는 싱글턴이고 시드를 돌려준다', async () => {
    const api = getApi();
    expect(getApi()).toBe(api);
    expect(await api.members.list()).toHaveLength(20);
  });
});
