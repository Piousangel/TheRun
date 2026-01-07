import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/config';
import type {
  VoteSession,
  VoteResponse,
  CreateVoteSessionData,
  UpdateVoteSessionData,
} from '@/shared/types/vote';

export const voteKeys = {
  all: ['votes'] as const,
  sessions: () => [...voteKeys.all, 'sessions'] as const,
  session: (id: string) => [...voteKeys.sessions(), id] as const,
  responses: () => [...voteKeys.all, 'responses'] as const,
  responsesBySession: (sessionId: string) => [...voteKeys.responses(), sessionId] as const,
  activeSessions: () => [...voteKeys.all, 'active-sessions'] as const,
};

// Query: Get all vote sessions
export function useVoteSessions() {
  return useQuery({
    queryKey: voteKeys.sessions(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vote_sessions')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      return data as VoteSession[];
    },
  });
}

// Query: Get active vote sessions
export function useActiveVoteSessions() {
  return useQuery({
    queryKey: voteKeys.activeSessions(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vote_sessions')
        .select('*')
        .eq('is_active', true)
        .order('event_date', { ascending: true });

      if (error) throw error;
      return data as VoteSession[];
    },
  });
}

// Query: Get single vote session
export function useVoteSession(id: string) {
  return useQuery({
    queryKey: voteKeys.session(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vote_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as VoteSession;
    },
    enabled: !!id,
  });
}

// Query: Get responses for a session
export function useVoteResponses(sessionId: string) {
  return useQuery({
    queryKey: voteKeys.responsesBySession(sessionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vote_responses')
        .select('*, members(*)')
        .eq('session_id', sessionId);

      if (error) throw error;
      return data as (VoteResponse & { members: any })[];
    },
    enabled: !!sessionId,
  });
}

// Mutation: Create vote session
export function useCreateVoteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVoteSessionData) => {
      const { data: session, error } = await supabase
        .from('vote_sessions')
        .insert({ ...data, is_active: true })
        .select()
        .single();

      if (error) throw error;
      return session as VoteSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voteKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: voteKeys.activeSessions() });
    },
  });
}

// Mutation: Update vote session
export function useUpdateVoteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateVoteSessionData }) => {
      const { data: session, error } = await supabase
        .from('vote_sessions')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return session as VoteSession;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: voteKeys.session(variables.id) });
      queryClient.invalidateQueries({ queryKey: voteKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: voteKeys.activeSessions() });
    },
  });
}

// Mutation: Vote (create or update response)
export function useVote() {
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
        .from('vote_responses')
        .select('*')
        .eq('session_id', sessionId)
        .eq('member_id', memberId)
        .single();

      if (existing) {
        // Update existing vote
        const { data, error } = await supabase
          .from('vote_responses')
          .update({ status })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as VoteResponse;
      } else {
        // Create new vote
        const { data, error } = await supabase
          .from('vote_responses')
          .insert({ session_id: sessionId, member_id: memberId, status })
          .select()
          .single();

        if (error) throw error;
        return data as VoteResponse;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: voteKeys.responsesBySession(variables.sessionId),
      });
    },
  });
}

// Mutation: Delete vote session
export function useDeleteVoteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vote_sessions').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voteKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: voteKeys.activeSessions() });
    },
  });
}
