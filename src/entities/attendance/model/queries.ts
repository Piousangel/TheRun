import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/config';
import type {
  AttendanceVote,
  AttendanceSession,
} from '@/shared/types/attendance';
import type { Member } from '@/shared/types/member';

export const attendanceKeys = {
  all: ['attendance'] as const,
  sessions: () => [...attendanceKeys.all, 'sessions'] as const,
  session: (id: string) => [...attendanceKeys.sessions(), id] as const,
  votes: () => [...attendanceKeys.all, 'votes'] as const,
  votesBySession: (sessionId: string) => [...attendanceKeys.votes(), sessionId] as const,
  currentSession: () => [...attendanceKeys.all, 'current-session'] as const,
};

// Query: Get current active attendance session
export function useCurrentAttendanceSession() {
  return useQuery({
    queryKey: attendanceKeys.currentSession(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        // No active session is ok
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as AttendanceSession;
    },
  });
}

// Query: Get votes for a session
export function useAttendanceVotes(sessionId: string) {
  return useQuery({
    queryKey: attendanceKeys.votesBySession(sessionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_votes')
        .select('*, members(*)')
        .eq('session_id', sessionId);

      if (error) throw error;
      return data as (AttendanceVote & { members: Member | null })[];
    },
    enabled: !!sessionId,
  });
}

// Mutation: Create or update vote
export function useVoteAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      memberId,
      status,
    }: {
      sessionId: string;
      memberId: string;
      status: 'attending' | 'absent';
    }) => {
      // Check if vote exists
      const { data: existing } = await supabase
        .from('attendance_votes')
        .select('*')
        .eq('session_id', sessionId)
        .eq('member_id', memberId)
        .single();

      if (existing) {
        // Update existing vote
        const { data, error } = await supabase
          .from('attendance_votes')
          .update({ status })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as AttendanceVote;
      } else {
        // Create new vote
        const { data, error } = await supabase
          .from('attendance_votes')
          .insert({ session_id: sessionId, member_id: memberId, status })
          .select()
          .single();

        if (error) throw error;
        return data as AttendanceVote;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.votesBySession(variables.sessionId),
      });
    },
  });
}

// Mutation: Create new attendance session
export function useCreateAttendanceSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { match_date: string; deadline: string }) => {
      // Deactivate all existing sessions
      await supabase
        .from('attendance_sessions')
        .update({ is_active: false })
        .eq('is_active', true);

      // Create new session
      const { data: session, error } = await supabase
        .from('attendance_sessions')
        .insert({ ...data, is_active: true })
        .select()
        .single();

      if (error) throw error;
      return session as AttendanceSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.currentSession() });
    },
  });
}
