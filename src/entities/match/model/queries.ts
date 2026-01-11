import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/config';
import type { Match, CreateMatchData, UpdateMatchData } from '@/shared/types/match';

export const matchKeys = {
  all: ['matches'] as const,
  lists: () => [...matchKeys.all, 'list'] as const,
  list: (filters?: string) => [...matchKeys.lists(), { filters }] as const,
  details: () => [...matchKeys.all, 'detail'] as const,
  detail: (id: string) => [...matchKeys.details(), id] as const,
};

// Query: Get all matches
export function useMatches() {
  return useQuery({
    queryKey: matchKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Match[];
    },
  });
}

// Query: Get single match
export function useMatch(id: string) {
  return useQuery({
    queryKey: matchKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Match;
    },
    enabled: !!id,
  });
}

// Mutation: Create match
export function useCreateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMatchData) => {
      const matchData = {
        ...data,
        status: data.status || 'pending',
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        duration: data.duration || null,
      };

      const { data: match, error } = await supabase
        .from('matches')
        .insert(matchData)
        .select()
        .single();

      if (error) throw error;
      return match as Match;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
}

// Mutation: Update match
export function useUpdateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMatchData }) => {
      const { data: matches, error } = await supabase
        .from('matches')
        .update(data)
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!matches || matches.length === 0) {
        throw new Error('No match found or updated');
      }
      return matches[0] as Match;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
}

// Mutation: Delete match
export function useDeleteMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('matches').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
}
