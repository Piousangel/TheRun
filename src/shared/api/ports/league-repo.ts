import type {
  AddGoalData,
  Appearance,
  CreateLeagueTeamData,
  CreateSeasonData,
  Fixture,
  FixtureStatus,
  GenerateScheduleInput,
  GoalEvent,
  LeagueTeam,
  Matchday,
  Season,
  SetLineupData,
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

  /** 시즌 전체 골 이벤트(순위 계산용). 기록 순(created_at 오름차순) */
  listGoals(seasonId: string): Promise<GoalEvent[]>;
  /**
   * 골 한 건을 기록한다. 같은 id가 이미 있으면 새로 만들지 않고 기존 기록을 돌려준다(멱등).
   * 팀이 그 경기의 두 팀이 아니거나, 쿼터가 시즌 쿼터 수를 벗어나거나, 득점자와 도움이 같으면 거부한다.
   */
  addGoal(data: AddGoalData): Promise<GoalEvent>;
  /** 골 한 건을 지운다. 없으면 아무 일도 하지 않는다. actorId는 감사 기록에 남는다. */
  removeGoal(id: string, actorId?: string | null): Promise<void>;

  /** 시즌 전체 쿼터별 출전 기록(개인 기록 계산용). 경기 → 쿼터 → 팀 순서는 보장하지 않는다. */
  listAppearances(seasonId: string): Promise<Appearance[]>;
  /**
   * 한 경기·한 쿼터·한 팀의 출전 명단을 통째로 바꾸고 새 명단을 돌려준다. 같은 회원이 두 번 들어오면 한 번만 남긴다.
   * 팀이 그 경기의 두 팀이 아니거나, 쿼터가 범위 밖이거나, 같은 쿼터에 상대 팀 명단에 이미 있는 회원이면 거부한다.
   * 명단이 실제로 바뀐 경우에만 경기(`fixture`) 변경 이력에 남긴다.
   */
  setLineup(data: SetLineupData): Promise<Appearance[]>;
}
