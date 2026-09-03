import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { attendanceKeys } from '@/entities/attendance/model/keys';
import { invalidateVoteAndAttendance } from '@/entities/vote/model/invalidate';
import { getApi } from '@/shared/api/client';
import type { AttendanceSession, AttendanceVote } from '@/shared/types/attendance';
import type { Member } from '@/shared/types/member';
import type { VoteSession } from '@/shared/types/vote';

/**
 * 출석은 별도 테이블이 아니라 `type: 'match'` 투표 세션이다(스펙 §1 출석→투표 흡수).
 * 이 모듈은 옛 출석 위젯이 기대하는 형태로 매핑만 한다. Phase 3에서 위젯이 재작성되면 함께 삭제한다.
 * 키 팩토리는 순환 import를 피하려고 `./keys`에 두고 기존 경로에서 그대로 다시 내보낸다.
 */
export { attendanceKeys };

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
    onSuccess: () => invalidateVoteAndAttendance(queryClient),
  });
}

export function useCreateAttendanceSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { match_date: string; deadline: string }): Promise<AttendanceSession> => {
      // 이전 활성 경기 세션을 닫는 규칙은 리포(withSingleActiveMatchSession)가 순차로 처리한다.
      // 여기서 Promise.all로 함께 닫으면 같은 스냅샷을 읽고 되써서 하나만 닫히는 유실이 났다.
      const created = await getApi().votes.createSession({
        title: `${format(new Date(data.match_date), 'M월 d일')} 정기 경기`,
        type: 'match',
        event_date: data.match_date,
        deadline: data.deadline,
      });
      return toAttendanceSession(created);
    },
    onSuccess: () => invalidateVoteAndAttendance(queryClient),
  });
}
