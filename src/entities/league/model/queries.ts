import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leagueKeys } from '@/entities/league/model/keys';
import { getApi } from '@/shared/api/client';
import type {
  AddGoalData,
  CreateLeagueTeamData,
  CreateMiniGameData,
  FixtureStatus,
  CreateSeasonData,
  Draft,
  GenerateScheduleInput,
  MakeDraftPickData,
  Season,
  SetAvailabilityData,
  SetLineupData,
  SetMiniGameResultsData,
  StartDraftData,
  UpdateLeagueTeamData,
  UpdateSeasonData,
} from '@/shared/types/league';

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

/** 팀이 바뀌면 팀 목록과(삭제 거부 규칙 때문에) 일정을 함께 다시 읽는다. */
function useInvalidateSeasonParts() {
  const queryClient = useQueryClient();
  return (seasonId: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: leagueKeys.teams(seasonId) }),
      queryClient.invalidateQueries({ queryKey: leagueKeys.schedule(seasonId) }),
    ]);
}

export function useCreateLeagueTeam() {
  const invalidate = useInvalidateSeasonParts();
  return useMutation({
    mutationFn: (data: CreateLeagueTeamData) => getApi().league.createTeam(data),
    onSuccess: (team) => invalidate(team.season_id),
  });
}

export function useUpdateLeagueTeam() {
  const invalidate = useInvalidateSeasonParts();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; seasonId: string; data: UpdateLeagueTeamData }) => getApi().league.updateTeam(id, data),
    onSuccess: (_team, { seasonId }) => invalidate(seasonId),
  });
}

export function useRemoveLeagueTeam() {
  const invalidate = useInvalidateSeasonParts();
  return useMutation({
    mutationFn: ({ id }: { id: string; seasonId: string }) => getApi().league.removeTeam(id),
    onSuccess: (_void, { seasonId }) => invalidate(seasonId),
  });
}

export function useGenerateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ seasonId, input }: { seasonId: string; input: GenerateScheduleInput }) =>
      getApi().league.generateSchedule(seasonId, input),
    onSuccess: (_schedule, { seasonId }) => queryClient.invalidateQueries({ queryKey: leagueKeys.schedule(seasonId) }),
  });
}

/** 시즌 전체 골 이벤트. 경기 점수·순위·개인 기록이 모두 여기서 계산된다. */
export function useLeagueGoals(seasonId: string | null) {
  return useQuery({
    queryKey: leagueKeys.goals(seasonId ?? ''),
    queryFn: () => getApi().league.listGoals(seasonId as string),
    enabled: !!seasonId,
  });
}

/** 경기 변경 이력(골 기록·삭제). 최신순 */
export function useFixtureHistory(fixtureId: string | null) {
  return useQuery({
    queryKey: leagueKeys.fixtureHistory(fixtureId ?? ''),
    queryFn: () => getApi().audit.listFor('fixture', fixtureId as string),
    enabled: !!fixtureId,
  });
}

function useInvalidateGoals() {
  const queryClient = useQueryClient();
  return (seasonId: string, fixtureId: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: leagueKeys.goals(seasonId) }),
      queryClient.invalidateQueries({ queryKey: leagueKeys.fixtureHistory(fixtureId) }),
    ]);
}

export function useAddGoal() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: ({ data }: { seasonId: string; data: AddGoalData }) => getApi().league.addGoal(data),
    onSuccess: (goal, { seasonId }) => invalidate(seasonId, goal.fixture_id),
  });
}

export function useRemoveGoal() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: ({ id, actorId }: { id: string; seasonId: string; fixtureId: string; actorId: string | null }) =>
      getApi().league.removeGoal(id, actorId),
    onSuccess: (_void, { seasonId, fixtureId }) => invalidate(seasonId, fixtureId),
  });
}

export function useSetFixtureStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fixtureId, status }: { fixtureId: string; seasonId: string; status: FixtureStatus }) =>
      getApi().league.setFixtureStatus(fixtureId, status),
    onSuccess: (_fixture, { seasonId }) => queryClient.invalidateQueries({ queryKey: leagueKeys.schedule(seasonId) }),
  });
}

/** 시즌 전체 쿼터별 출전 기록. 출전 쿼터 수·개인 기록 계산에 쓴다. */
export function useLeagueAppearances(seasonId: string | null) {
  return useQuery({
    queryKey: leagueKeys.appearances(seasonId ?? ''),
    queryFn: () => getApi().league.listAppearances(seasonId as string),
    enabled: !!seasonId,
  });
}

export function useSetLineup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { seasonId: string; data: SetLineupData }) => getApi().league.setLineup(data),
    onSuccess: (_lineup, { seasonId, data }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: leagueKeys.appearances(seasonId) }),
        queryClient.invalidateQueries({ queryKey: leagueKeys.fixtureHistory(data.fixture_id) }),
      ]),
  });
}

/** 시즌 미니게임(종목·승점·결과). 순위표의 미니게임 승점이 여기서 계산된다. */
export function useLeagueMiniGames(seasonId: string | null) {
  return useQuery({
    queryKey: leagueKeys.miniGames(seasonId ?? ''),
    queryFn: () => getApi().league.listMiniGames(seasonId as string),
    enabled: !!seasonId,
  });
}

export function useCreateMiniGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMiniGameData) => getApi().league.createMiniGame(data),
    onSuccess: (game) => queryClient.invalidateQueries({ queryKey: leagueKeys.miniGames(game.season_id) }),
  });
}

export function useRemoveMiniGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actorId }: { id: string; seasonId: string; actorId: string | null }) => getApi().league.removeMiniGame(id, actorId),
    onSuccess: (_void, { seasonId }) => queryClient.invalidateQueries({ queryKey: leagueKeys.miniGames(seasonId) }),
  });
}

export function useSetMiniGameResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SetMiniGameResultsData) => getApi().league.setMiniGameResults(data),
    onSuccess: (game) => queryClient.invalidateQueries({ queryKey: leagueKeys.miniGames(game.season_id) }),
  });
}

/** 시즌 참석 가능 주차(드래프트 선수 카드·운영진 집계). 입력한 회원만 행이 있다. */
export function useLeagueAvailability(seasonId: string | null) {
  return useQuery({
    queryKey: leagueKeys.availability(seasonId ?? ''),
    queryFn: () => getApi().league.listAvailability(seasonId as string),
    enabled: !!seasonId,
  });
}

export function useSetAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SetAvailabilityData) => getApi().league.setAvailability(data),
    onSuccess: (row) => queryClient.invalidateQueries({ queryKey: leagueKeys.availability(row.season_id) }),
  });
}

/** 드래프트가 진행 중이거나 아직 시작 전이면 이 간격으로 다시 읽는다(데모 모드에서 다른 탭·기기의 픽 반영). Supabase 전환 시 Realtime 구독으로 바꾼다. */
export const DRAFT_SYNC_MS = 2000;

/** 시즌 드래프트. `live`면 끝나기 전까지 주기적으로 다시 읽어 다른 팀장의 픽이 바로 보인다(드래프트 화면). */
export function useLeagueDraft(seasonId: string | null, { live = false }: { live?: boolean } = {}) {
  return useQuery({
    queryKey: leagueKeys.draft(seasonId ?? ''),
    queryFn: () => getApi().league.getDraft(seasonId as string),
    enabled: !!seasonId,
    refetchInterval: (query) => (live && query.state.data?.status !== 'done' ? DRAFT_SYNC_MS : false),
    staleTime: live ? 0 : undefined,
  });
}

function useDraftMutation<T>(fn: (data: T) => Promise<Draft>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (draft) => {
      queryClient.setQueryData(leagueKeys.draft(draft.season_id), draft);
    },
  });
}

export function useStartDraft() {
  return useDraftMutation((data: StartDraftData) => getApi().league.startDraft(data));
}

export function useMakeDraftPick() {
  return useDraftMutation((data: MakeDraftPickData) => getApi().league.makeDraftPick(data));
}

export function useUndoDraftPick() {
  return useDraftMutation((data: { seasonId: string; actorId?: string | null }) => getApi().league.undoDraftPick(data.seasonId, data.actorId));
}

export function useFinishDraft() {
  return useDraftMutation((data: { seasonId: string; actorId?: string | null }) => getApi().league.finishDraft(data.seasonId, data.actorId));
}
