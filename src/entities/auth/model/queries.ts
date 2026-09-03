'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memberKeys } from '@/entities/member/model/queries';
import { getApi } from '@/shared/api/client';
import type { AuthUser } from '@/shared/api/ports/auth-repo';
import type { AppProfile } from '@/shared/types/auth';

export const authKeys = {
  all: ['auth'] as const,
  profile: (userId?: string) => [...authKeys.all, 'profile', userId] as const,
  adminProfiles: () => [...authKeys.all, 'admin-profiles'] as const,
  claimableMembers: (userId?: string) => [...authKeys.all, 'claimable-members', userId] as const,
};

export function useAuthProfile(user: AuthUser | null) {
  return useQuery({
    queryKey: authKeys.profile(user?.id),
    queryFn: () => (user ? getApi().auth.ensureProfile(user) : null),
    enabled: !!user,
  });
}

export function useAdminProfiles(enabled: boolean) {
  return useQuery({ queryKey: authKeys.adminProfiles(), queryFn: () => getApi().auth.listProfiles(), enabled });
}

export function useUpdateAppProfileRole(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, role }: { profileId: string; role: Extract<AppProfile['role'], 'member' | 'admin'> }) => {
      if (!userId) throw new Error('로그인이 필요합니다.');
      return getApi().auth.setProfileRole(profileId, role);
    },
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: authKeys.adminProfiles() });
      queryClient.invalidateQueries({ queryKey: authKeys.profile(profile.id) });
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}

export function useLinkMemberProfile(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId }: { memberId: string; phoneNumber?: string }) => {
      if (!userId) throw new Error('로그인이 필요합니다.');
      return getApi().auth.linkMyMember(memberId);
    },
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: authKeys.profile(userId ?? undefined) });
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
      if (profile.member_id) queryClient.invalidateQueries({ queryKey: memberKeys.detail(profile.member_id) });
      queryClient.invalidateQueries({ queryKey: authKeys.claimableMembers(userId ?? undefined) });
    },
  });
}

export function useClaimableMembers(userId: string | null) {
  return useQuery({
    queryKey: authKeys.claimableMembers(userId ?? undefined),
    queryFn: () => getApi().auth.listClaimableMembers(),
    enabled: !!userId,
    retry: false,
  });
}

export function useUpdateMyMemberProfile(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; phoneNumber: string }) => {
      if (!userId) throw new Error('로그인이 필요합니다.');
      return getApi().auth.updateMyMemberProfile(input);
    },
    onSuccess: (member) => {
      queryClient.invalidateQueries({ queryKey: authKeys.profile(userId ?? undefined) });
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(member.id) });
    },
  });
}

export function useUnlinkMemberProfile(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('로그인이 필요합니다.');
      return getApi().auth.unlinkMyMember();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.profile(userId ?? undefined) });
      queryClient.invalidateQueries({ queryKey: authKeys.claimableMembers(userId ?? undefined) });
    },
  });
}
