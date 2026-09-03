import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateVoteAndAttendance } from '@/entities/vote/model/invalidate';
import { voteKeys } from '@/entities/vote/model/keys';
import { getApi } from '@/shared/api/client';
import type { RespondInput } from '@/shared/api/ports/vote-repo';
import type { CreateVoteSessionData, UpdateVoteSessionData, VoteSession } from '@/shared/types/vote';

/** 키 팩토리는 순환 import를 피하려고 `./keys`에 두고 기존 경로에서 그대로 다시 내보낸다. */
export { voteKeys };

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
    onSuccess: () => invalidateVoteAndAttendance(queryClient),
  });
}

export function useUpdateVoteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVoteSessionData }) => getApi().votes.updateSession(id, data),
    onSuccess: () => invalidateVoteAndAttendance(queryClient),
  });
}

export function useVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RespondInput) => getApi().votes.respond(input),
    onSuccess: () => invalidateVoteAndAttendance(queryClient),
  });
}

export function useDeleteVoteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getApi().votes.removeSession(id),
    onSuccess: () => invalidateVoteAndAttendance(queryClient),
  });
}
