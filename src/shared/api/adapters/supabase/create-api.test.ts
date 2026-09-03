import { createSupabaseApi } from '@/shared/api/adapters/supabase/create-api';
import { ApiError } from '@/shared/api/ports/errors';

interface StubResult {
  data: unknown;
  error: { message: string; code?: string } | null;
}

const hoisted = vi.hoisted(() => ({
  client: null as unknown,
}));

vi.mock('@/shared/api/adapters/supabase/config', () => ({
  getSupabaseClient: () => hoisted.client,
}));

/** from(...).select(...).order/eq(...)와 insert(...).select().single()을 모두 받아주는 최소 스텁. */
function stubClient(result: StubResult) {
  const captured: { table?: string; payload?: unknown } = {};
  const builder = {
    select: () => builder,
    order: () => builder,
    eq: () => builder,
    insert: (payload: unknown) => {
      captured.payload = payload;
      return builder;
    },
    single: async () => result,
    maybeSingle: async () => result,
    then: (resolve: (value: StubResult) => unknown) => resolve(result),
  };
  hoisted.client = {
    from: (table: string) => {
      captured.table = table;
      return builder;
    },
    auth: {
      getUser: async () => ({ data: { user: { id: 'u-current', email: 'me@therun.demo' } }, error: null }),
    },
  };
  return captured;
}

describe('createSupabaseApi', () => {
  it('쿼리 에러의 code를 ApiError로 보존한다', async () => {
    stubClient({ data: null, error: { message: '권한이 없습니다.', code: '42501' } });
    await expect(createSupabaseApi().members.list()).rejects.toMatchObject({ message: '권한이 없습니다.', code: '42501' });
    await createSupabaseApi()
      .members.list()
      .catch((error: unknown) => {
        expect(error).toBeInstanceOf(ApiError);
      });
  });

  it('공지 스키마가 배포되지 않았으면(PGRST205) 빈 목록으로 폴백한다', async () => {
    stubClient({ data: null, error: { message: "Could not find the table 'public.announcements' in the schema cache", code: 'PGRST205' } });
    const api = createSupabaseApi();
    expect(await api.announcements.list()).toEqual([]);
    expect(await api.announcements.get('an-1')).toBeNull();
    expect(await api.announcements.listReads('u-current')).toEqual([]);
  });

  it('공지 생성은 현재 로그인 사용자를 created_by로 넣는다', async () => {
    const captured = stubClient({ data: { id: 'an-9', created_by: 'u-current' }, error: null });
    const created = await createSupabaseApi().announcements.create({ title: 't', body: 'b', category: 'general' });
    expect(created.created_by).toBe('u-current');
    expect(captured.table).toBe('announcements');
    expect(captured.payload).toMatchObject({ title: 't', created_by: 'u-current' });
  });
});
