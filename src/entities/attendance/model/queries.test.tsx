import { act, renderHook, waitFor } from '@testing-library/react';
import {
  useAttendanceVotes,
  useCreateAttendanceSession,
  useCurrentAttendanceSession,
  useVoteAttendance,
} from '@/entities/attendance/model/queries';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

describe('attendance queries (mapped onto match votes)', () => {
  afterEach(() => __setApiForTests(null));

  it('현재 출석 세션은 가장 가까운 활성 경기 투표다', async () => {
    const { wrapper } = setupTestApi();
    const { result } = renderHook(() => useCurrentAttendanceSession(), { wrapper });
    await waitFor(() => expect(result.current.data).not.toBeUndefined());
    expect(result.current.data).toMatchObject({ id: 'vs-this-week', is_active: true });
    expect(result.current.data?.match_date).toBeTruthy();
  });

  it('출석 응답은 세션 날짜와 멤버를 포함하고, useVoteAttendance로 upsert된다', async () => {
    const { wrapper } = setupTestApi();
    const { result } = renderHook(() => ({ votes: useAttendanceVotes('vs-this-week'), vote: useVoteAttendance() }), { wrapper });
    await waitFor(() => expect(result.current.votes.data).toHaveLength(12));
    expect(result.current.votes.data![0].members?.name).toBeTruthy();
    await act(async () => {
      await result.current.vote.mutateAsync({ sessionId: 'vs-this-week', memberId: 'm-20', status: 'attending' });
    });
    await waitFor(() => expect(result.current.votes.data).toHaveLength(13));
  });

  it('새 출석 세션을 만들면 기존 활성 경기 투표는 닫힌다', async () => {
    const { wrapper, api } = setupTestApi();
    const { result } = renderHook(() => ({ create: useCreateAttendanceSession(), current: useCurrentAttendanceSession() }), { wrapper });
    await waitFor(() => expect(result.current.current.data?.id).toBe('vs-this-week'));
    await act(async () => {
      await result.current.create.mutateAsync({ match_date: '2026-09-19T07:00:00.000Z', deadline: '2026-09-18T14:59:00.000Z' });
    });
    await waitFor(() => expect(result.current.current.data?.id).not.toBe('vs-this-week'));
    const old = await api.votes.getSession('vs-this-week');
    expect(old?.is_active).toBe(false);
    expect(result.current.current.data?.match_date).toBe('2026-09-19T07:00:00.000Z');
  });
});
