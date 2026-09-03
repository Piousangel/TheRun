import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApi } from '@/shared/api/client';
import type { CreateMemberData, Member, UpdateMemberData } from '@/shared/types/member';

export const memberKeys = {
  all: ['members'] as const,
  lists: () => [...memberKeys.all, 'list'] as const,
  list: (filters?: string) => [...memberKeys.lists(), { filters }] as const,
  details: () => [...memberKeys.all, 'detail'] as const,
  detail: (id: string) => [...memberKeys.details(), id] as const,
};

export function useMembers() {
  return useQuery({ queryKey: memberKeys.lists(), queryFn: () => getApi().members.list() });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: memberKeys.detail(id),
    queryFn: async (): Promise<Member> => {
      const member = await getApi().members.get(id);
      if (!member) throw new Error('멤버를 찾을 수 없습니다.');
      return member;
    },
    enabled: !!id,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemberData) => getApi().members.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberData }) => getApi().members.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getApi().members.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}
