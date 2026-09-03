import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { voteKeys } from '@/entities/vote/model/queries';
import { getApi } from '@/shared/api/client';
import type { AttendanceSession, AttendanceVote } from '@/shared/types/attendance';
import type { Member } from '@/shared/types/member';
import type { VoteSession } from '@/shared/types/vote';

/**
 * 출석은 별도 테이블이 아니라 `type: 'match'` 투표 세션이다(스펙 §1 출석→투표 흡수).
 * 이 모듈은 옛 출석 위젯이 기대하는 형태로 매핑만 한다. Phase 3에서 위젯이 재작성되면 함께 삭제한다.
 */
export const attendanceKeys = {
  all: ['attendance'] as const,
  sessions: () => [...attendanceKeys.all, 'sessions'] as const,
  session: (id: string) => [...attendanceKeys.sessions(), id] as const,
  votes: () => [...attendanceKeys.all, 'votes'] as const,
  votesBySession: (sessionId: string) => [...attendanceKeys.votes(), sessionId] as const,
  currentSession: () => [...attendanceKeys.all, 'current-session'] as const,
};

function toAttendanceSession(session: VoteSession): AttendanceSession {
  return { id: session.id, match_date: session.event_date, deadline: session.deadline, is_active: session.is_active, created_at: session.created_at };
}

export function useCurrentAttendanceSession() {
  return useQuery({
    queryKey: attendanceKeys.currentSession(),
    queryFn: async (): Promise<AttendanceSession | null> => {
      const active = await getApi().votes.listActiveSessions();
      const match = active.find((session) => session.type === 'match');
      return match ? toAttendanceSession(match) : null;
    },
  });
}

export function useAttendanceVotes(sessionId: string) {
  return useQuery({
    queryKey: attendanceKeys.votesBySession(sessionId),
    queryFn: async (): Promise<(AttendanceVote & { members: Member | null })[]> => {
      const api = getApi();
      const [session, responses] = await Promise.all([api.votes.getSession(sessionId), api.votes.listResponses(sessionId)]);
      if (!session) return [];
      return responses.map((response) => ({
        id: response.id,
        match_date: session.event_date,
        deadline: session.deadline,
        member_id: response.member_id,
        status: response.status,
        created_at: response.created_at,
        updated_at: response.updated_at,
        members: response.members,
      }));
    },
    enabled: !!sessionId,
  });
}

export function useVoteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { sessionId: string; memberId: string; status: 'attending' | 'absent' }) => getApi().votes.respond(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.votesBySession(variables.sessionId) });
      queryClient.invalidateQueries({ queryKey: voteKeys.responsesBySession(variables.sessionId) });
    },
  });
}

export function useCreateAttendanceSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { match_date: string; deadline: string }): Promise<AttendanceSession> => {
      const api = getApi();
      const active = await api.votes.listActiveSessions();
      await Promise.all(active.filter((s) => s.type === 'match').map((s) => api.votes.updateSession(s.id, { is_active: false })));
      const created = await api.votes.createSession({
        title: `${format(new Date(data.match_date), 'M월 d일')} 정기 경기`,
        type: 'match',
        event_date: data.match_date,
        deadline: data.deadline,
      });
      return toAttendanceSession(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({ queryKey: voteKeys.all });
    },
  });
}
