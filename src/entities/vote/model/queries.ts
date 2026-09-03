import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApi } from '@/shared/api/client';
import type { RespondInput } from '@/shared/api/ports/vote-repo';
import type { CreateVoteSessionData, UpdateVoteSessionData, VoteSession } from '@/shared/types/vote';

export const voteKeys = {
  all: ['votes'] as const,
  sessions: () => [...voteKeys.all, 'sessions'] as const,
  session: (id: string) => [...voteKeys.sessions(), id] as const,
  responses: () => [...voteKeys.all, 'responses'] as const,
  responsesBySession: (sessionId: string) => [...voteKeys.responses(), sessionId] as const,
  activeSessions: () => [...voteKeys.all, 'active-sessions'] as const,
};

export function useVoteSessions() {
  return useQuery({ queryKey: voteKeys.sessions(), queryFn: () => getApi().votes.listSessions() });
}

export function useActiveVoteSessions() {
  return useQuery({ queryKey: voteKeys.activeSessions(), queryFn: () => getApi().votes.listActiveSessions() });
}

export function useVoteSession(id: string) {
  return useQuery({
    queryKey: voteKeys.session(id),
    queryFn: async (): Promise<VoteSession> => {
      const session = await getApi().votes.getSession(id);
      if (!session) throw new Error('투표를 찾을 수 없습니다.');
      return session;
    },
    enabled: !!id,
  });
}

export function useVoteResponses(sessionId: string) {
  return useQuery({
    queryKey: voteKeys.responsesBySession(sessionId),
    queryFn: () => getApi().votes.listResponses(sessionId),
    enabled: !!sessionId,
  });
}

export function useCreateVoteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVoteSessionData) => getApi().votes.createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voteKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: voteKeys.activeSessions() });
    },
  });
}

export function useUpdateVoteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVoteSessionData }) => getApi().votes.updateSession(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: voteKeys.session(variables.id) });
      queryClient.invalidateQueries({ queryKey: voteKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: voteKeys.activeSessions() });
    },
  });
}

export function useVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RespondInput) => getApi().votes.respond(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: voteKeys.responsesBySession(variables.sessionId) });
    },
  });
}

export function useDeleteVoteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getApi().votes.removeSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voteKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: voteKeys.activeSessions() });
    },
  });
}
