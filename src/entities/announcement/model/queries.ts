'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApi } from '@/shared/api/client';
import type { AnnouncementRead, CreateAnnouncementData, UpdateAnnouncementData } from '@/shared/types/announcement';

export const announcementKeys = {
  all: ['announcements'] as const,
  lists: () => [...announcementKeys.all, 'list'] as const,
  detail: (id: string) => [...announcementKeys.all, 'detail', id] as const,
  reads: () => [...announcementKeys.all, 'reads'] as const,
  readsByUser: (userId?: string) => [...announcementKeys.reads(), userId] as const,
};

export function useAnnouncements() {
  return useQuery({ queryKey: announcementKeys.lists(), queryFn: () => getApi().announcements.list() });
}

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: announcementKeys.detail(id),
    queryFn: () => getApi().announcements.get(id),
    enabled: !!id,
  });
}

export function useAnnouncementReads(userId?: string | null) {
  return useQuery({
    queryKey: announcementKeys.readsByUser(userId ?? undefined),
    queryFn: async (): Promise<AnnouncementRead[]> => (userId ? getApi().announcements.listReads(userId) : []),
    enabled: !!userId,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAnnouncementData) => getApi().announcements.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementData }) => getApi().announcements.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: announcementKeys.detail(variables.id) });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getApi().announcements.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
}

export function useMarkAnnouncementRead(userId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (announcementId: string) => {
      if (!userId) throw new Error('로그인이 필요합니다.');
      return getApi().announcements.markRead(announcementId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.readsByUser(userId ?? undefined) });
    },
  });
}
