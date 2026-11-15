import type {
  CreateLeagueTeamData,
  CreateSeasonData,
  Fixture,
  FixtureStatus,
  GenerateScheduleInput,
  LeagueTeam,
  Matchday,
  Season,
  UpdateLeagueTeamData,
  UpdateSeasonData,
} from '@/shared/types/league';

export interface LeagueSchedule {
  matchdays: Matchday[];
  fixtures: Fixture[];
}

export interface LeagueRepo {
  /** starts_on 내림차순 */
  listSeasons(): Promise<Season[]>;
  getSeason(id: string): Promise<Season | null>;
  /** 기본값: 3쿼터·10분·6:6·승3무1패0·득실차→다득점→승자승·member_vote, status draft */
  createSeason(data: CreateSeasonData): Promise<Season>;
  updateSeason(id: string, data: UpdateSeasonData): Promise<Season>;
  /** 시즌과 딸린 팀·경기일·경기를 함께 지운다 */
  removeSeason(id: string): Promise<void>;

  /** 생성 순서 */
  listTeams(seasonId: string): Promise<LeagueTeam[]>;
  createTeam(data: CreateLeagueTeamData): Promise<LeagueTeam>;
  updateTeam(id: string, data: UpdateLeagueTeamData): Promise<LeagueTeam>;
  /** 일정이 이미 만들어진 시즌에서는 거부한다 */
  removeTeam(id: string): Promise<void>;

  /** week 오름차순 */
  listMatchdays(seasonId: string): Promise<Matchday[]>;
  /** 경기일 → order 오름차순 */
  listFixtures(seasonId: string): Promise<Fixture[]>;
  /**
   * 팀 목록으로 경기일·경기를 만든다. 이미 있던 일정은 모든 경기가 scheduled일 때만 교체하고,
   * 시작된 경기가 있으면 거부한다.
   */
  generateSchedule(seasonId: string, input: GenerateScheduleInput): Promise<LeagueSchedule>;
  setFixtureStatus(fixtureId: string, status: FixtureStatus): Promise<Fixture>;
}
