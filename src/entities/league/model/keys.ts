/** 리그 쿼리 키 팩토리 */
export const leagueKeys = {
  all: ['league'] as const,
  seasons: () => [...leagueKeys.all, 'seasons'] as const,
  season: (id: string) => [...leagueKeys.seasons(), id] as const,
  teams: (seasonId: string) => [...leagueKeys.season(seasonId), 'teams'] as const,
  schedule: (seasonId: string) => [...leagueKeys.season(seasonId), 'schedule'] as const,
};
