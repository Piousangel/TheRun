import { act, renderHook, waitFor } from '@testing-library/react';
import { useCreateMember, useMembers } from '@/entities/member/model/queries';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

const STATS = { speed: 50, shooting: 50, passing: 50, dribbling: 50, stamina: 50, defense: 50 };

describe('member queries', () => {
  afterEach(() => __setApiForTests(null));

  it('useMembers는 시드 20명을 돌려주고, useCreateMember 후 목록이 갱신된다', async () => {
    const { wrapper } = setupTestApi();
    const { result } = renderHook(() => ({ list: useMembers(), create: useCreateMember() }), { wrapper });
    await waitFor(() => expect(result.current.list.data).toHaveLength(20));
    await act(async () => {
      await result.current.create.mutateAsync({ name: '새 멤버', phone_number: '010-9999-0000', stats: STATS });
    });
    await waitFor(() => expect(result.current.list.data).toHaveLength(21));
  });
});
