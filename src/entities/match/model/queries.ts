import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApi } from '@/shared/api/client';
import type { CreateMatchData, Match, UpdateMatchData } from '@/shared/types/match';

export const matchKeys = {
  all: ['matches'] as const,
  lists: () => [...matchKeys.all, 'list'] as const,
  list: (filters?: string) => [...matchKeys.lists(), { filters }] as const,
  details: () => [...matchKeys.all, 'detail'] as const,
  detail: (id: string) => [...matchKeys.details(), id] as const,
};

export function useMatches() {
  return useQuery({ queryKey: matchKeys.lists(), queryFn: () => getApi().matches.list() });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: matchKeys.detail(id),
    queryFn: async (): Promise<Match> => {
      const match = await getApi().matches.get(id);
      if (!match) throw new Error('경기를 찾을 수 없습니다.');
      return match;
    },
    enabled: !!id,
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMatchData) => getApi().matches.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMatchData }) => getApi().matches.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
}

export function useDeleteMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getApi().matches.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
}
