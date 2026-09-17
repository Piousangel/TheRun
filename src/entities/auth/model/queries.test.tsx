import { act, renderHook, waitFor } from '@testing-library/react';
import { useAuthProfile, useClaimableMembers, useLinkMemberProfile, useSignOut, useUnlinkMemberProfile } from '@/entities/auth/model/queries';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

describe('auth queries', () => {
  afterEach(() => __setApiForTests(null));

  it('프로필을 보장하고, 멤버 연결/해제가 쿼리를 갱신한다', async () => {
    const { api, wrapper } = setupTestApi();
    const user = await api.auth.signInAsDemo('unlinked');
    const { result } = renderHook(
      () => ({
        profile: useAuthProfile(user),
        claimable: useClaimableMembers(user.id),
        link: useLinkMemberProfile(user.id),
        unlink: useUnlinkMemberProfile(user.id),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.profile.data?.member_id).toBeNull());
    await waitFor(() => expect(result.current.claimable.data?.length).toBeGreaterThan(0));
    expect(result.current.claimable.data!.some((m) => m.id === 'm-02')).toBe(false); // u-admin에 연결됨

    await act(async () => {
      await result.current.link.mutateAsync({ memberId: 'm-10' });
    });
    await waitFor(() => expect(result.current.profile.data?.member_id).toBe('m-10'));

    await act(async () => {
      await result.current.unlink.mutateAsync();
    });
    await waitFor(() => expect(result.current.profile.data?.member_id).toBeNull());
  });

  it('로그아웃 상태면 프로필 쿼리는 비활성', () => {
    const { wrapper } = setupTestApi();
    const { result } = renderHook(() => useAuthProfile(null), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useSignOut', () => {
  afterEach(() => __setApiForTests(null));

  it('세션을 지운다', async () => {
    const { api, wrapper } = setupTestApi();
    await api.auth.signInAsDemo('member');
    const { result } = renderHook(() => useSignOut(), { wrapper });
    await act(() => result.current.mutateAsync());
    expect(await api.auth.getUser()).toBeNull();
  });
});
