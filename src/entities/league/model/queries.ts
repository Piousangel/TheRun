import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leagueKeys } from '@/entities/league/model/keys';
import { getApi } from '@/shared/api/client';
import type { CreateSeasonData, Season, UpdateSeasonData } from '@/shared/types/league';

export { leagueKeys };

export function useSeasons() {
  return useQuery({ queryKey: leagueKeys.seasons(), queryFn: () => getApi().league.listSeasons() });
}

export function useSeason(id: string | null) {
  return useQuery({
    queryKey: leagueKeys.season(id ?? ''),
    queryFn: async (): Promise<Season> => {
      const season = await getApi().league.getSeason(id as string);
      if (!season) throw new Error('시즌을 찾을 수 없습니다.');
      return season;
    },
    enabled: !!id,
  });
}

export function useLeagueTeams(seasonId: string | null) {
  return useQuery({
    queryKey: leagueKeys.teams(seasonId ?? ''),
    queryFn: () => getApi().league.listTeams(seasonId as string),
    enabled: !!seasonId,
  });
}

export function useLeagueSchedule(seasonId: string | null) {
  return useQuery({
    queryKey: leagueKeys.schedule(seasonId ?? ''),
    queryFn: async () => {
      const api = getApi().league;
      const [matchdays, fixtures] = await Promise.all([api.listMatchdays(seasonId as string), api.listFixtures(seasonId as string)]);
      return { matchdays, fixtures };
    },
    enabled: !!seasonId,
  });
}

export function useCreateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSeasonData) => getApi().league.createSeason(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leagueKeys.seasons() }),
  });
}

export function useUpdateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSeasonData }) => getApi().league.updateSeason(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leagueKeys.seasons() }),
  });
}
