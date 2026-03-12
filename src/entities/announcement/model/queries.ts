'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/config';
import type {
  Announcement,
  AnnouncementRead,
  CreateAnnouncementData,
  UpdateAnnouncementData,
} from '@/shared/types/announcement';

export const announcementKeys = {
  all: ['announcements'] as const,
  lists: () => [...announcementKeys.all, 'list'] as const,
  detail: (id: string) => [...announcementKeys.all, 'detail', id] as const,
  reads: () => [...announcementKeys.all, 'reads'] as const,
  readsByUser: (userId?: string) => [...announcementKeys.reads(), userId] as const,
};

export function useAnnouncements() {
  return useQuery({
    queryKey: announcementKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('publish_at', { ascending: false });

      if (error) throw error;
      return data as Announcement[];
    },
  });
}

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: announcementKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase.from('announcements').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Announcement;
    },
    enabled: !!id,
  });
}

export function useAnnouncementReads(userId?: string | null) {
  return useQuery({
    queryKey: announcementKeys.readsByUser(userId ?? undefined),
    queryFn: async () => {
      if (!userId) {
        return [] as AnnouncementRead[];
      }

      const { data, error } = await supabase
        .from('announcement_reads')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data as AnnouncementRead[];
    },
    enabled: !!userId,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAnnouncementData) => {
      const { data: announcement, error } = await supabase
        .from('announcements')
        .insert({
          ...data,
          publish_at: data.publish_at ?? new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) throw error;
      return announcement as Announcement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAnnouncementData }) => {
      const { data: announcement, error } = await supabase
        .from('announcements')
        .update(data)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return announcement as Announcement;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: announcementKeys.detail(variables.id) });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
}

export function useMarkAnnouncementRead(userId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (announcementId: string) => {
      if (!userId) {
        throw new Error('로그인이 필요합니다.');
      }

      const { data, error } = await supabase
        .from('announcement_reads')
        .upsert(
          {
            announcement_id: announcementId,
            user_id: userId,
          },
          { onConflict: 'announcement_id,user_id' }
        )
        .select('*')
        .single();

      if (error) throw error;
      return data as AnnouncementRead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.readsByUser(userId ?? undefined) });
    },
  });
}
