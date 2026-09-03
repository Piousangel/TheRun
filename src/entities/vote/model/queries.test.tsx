import { act, renderHook, waitFor } from '@testing-library/react';
import { useAttendanceVotes, useCurrentAttendanceSession } from '@/entities/attendance/model/queries';
import { useCreateVoteSession, useDeleteVoteSession, useVote } from '@/entities/vote/model/queries';
import { __setApiForTests } from '@/shared/api/client';
import { setupTestApi } from '@/shared/lib/test/query-wrapper';

describe('vote queries ↔ attendance 캐시', () => {
  afterEach(() => __setApiForTests(null));

  it('useVote로 응답하면 출석 화면 캐시도 갱신된다', async () => {
    const { wrapper } = setupTestApi();
    const { result } = renderHook(() => ({ vote: useVote(), attendance: useAttendanceVotes('vs-this-week') }), { wrapper });
    await waitFor(() => expect(result.current.attendance.data).toHaveLength(12));
    await act(async () => {
      await result.current.vote.mutateAsync({ sessionId: 'vs-this-week', memberId: 'm-20', status: 'attending' });
    });
    await waitFor(() => expect(result.current.attendance.data).toHaveLength(13));
  });

  it('투표 세션을 지우면 현재 출석 세션 캐시도 갱신된다', async () => {
    const { wrapper } = setupTestApi();
    const { result } = renderHook(() => ({ remove: useDeleteVoteSession(), current: useCurrentAttendanceSession() }), { wrapper });
    await waitFor(() => expect(result.current.current.data?.id).toBe('vs-this-week'));
    await act(async () => {
      await result.current.remove.mutateAsync('vs-this-week');
    });
    await waitFor(() => expect(result.current.current.data).toBeNull());
  });

  it('투표 만들기로 만든 경기 세션이 현재 출석 세션이 된다(이전 활성 경기 세션은 닫힌다)', async () => {
    const { wrapper, api } = setupTestApi();
    const { result } = renderHook(() => ({ create: useCreateVoteSession(), current: useCurrentAttendanceSession() }), { wrapper });
    await waitFor(() => expect(result.current.current.data?.id).toBe('vs-this-week'));
    await act(async () => {
      await result.current.create.mutateAsync({
        title: '10월 첫 경기',
        type: 'match',
        event_date: '2026-10-03T07:00:00.000Z',
        deadline: '2026-10-02T14:59:00.000Z',
      });
    });
    await waitFor(() => expect(result.current.current.data?.match_date).toBe('2026-10-03T07:00:00.000Z'));
    expect((await api.votes.getSession('vs-this-week'))?.is_active).toBe(false);
    expect((await api.votes.listActiveSessions()).filter((s) => s.type === 'match')).toHaveLength(1);
  });
});
