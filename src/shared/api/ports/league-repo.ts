import type {
  AddGoalData,
  Appearance,
  Availability,
  Draft,
  MakeDraftPickData,
  StartDraftData,
  CreateLeagueTeamData,
  CreateSeasonData,
  Fixture,
  FixtureStatus,
  GenerateScheduleInput,
  GoalEvent,
  LeagueTeam,
  Matchday,
  MiniGame,
  CreateMiniGameData,
  SetMiniGameResultsData,
  SetAvailabilityData,
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

  /** 시즌의 미니게임. 경기일 주차 → 만든 순서 (경기일 없는 종목은 뒤) */
  listMiniGames(seasonId: string): Promise<MiniGame[]>;
  /** 이름이 비었거나, 승점이 1~3개의 0 이상 정수가 아니거나, 다른 시즌의 경기일이면 거부한다. 기본 승점 [1] */
  createMiniGame(data: CreateMiniGameData): Promise<MiniGame>;
  /** 미니게임과 결과를 지운다. 없으면 아무 일도 하지 않는다 */
  removeMiniGame(id: string, actorId?: string | null): Promise<void>;
  /**
   * 결과를 통째로 바꾼다. 시즌 팀이 아니거나, 같은 팀이 두 번이거나, 등수가 1~팀 수 밖이면 거부한다.
   * 결과 입력·수정은 미니게임(`minigame`) 변경 이력에 남는다.
   */
  setMiniGameResults(data: SetMiniGameResultsData): Promise<MiniGame>;

  /** 시즌의 참석 가능 주차(입력한 회원만). 순서는 보장하지 않는다 */
  listAvailability(seasonId: string): Promise<Availability[]>;
  /**
   * 한 회원의 참석 가능 주차를 통째로 바꾼다(중복 제거·오름차순). 빈 배열이면 "한 주도 못 온다".
   * 주차가 1~시즌 주차 수(경기일 수, 일정이 없으면 기간으로 계산) 밖의 정수가 아니거나, 끝난 시즌이면 거부한다.
   * 변경은 시즌(`season`) 변경 이력에 남는다.
   */
  setAvailability(data: SetAvailabilityData): Promise<Availability>;

  /** 시즌 드래프트(시즌당 하나). 시작 전이면 null */
  getDraft(seasonId: string): Promise<Draft | null>;
  /**
   * 드래프트를 시작한다. order를 생략하면 추첨한다. 팀이 2개 미만이거나, 순서가 시즌 팀 전체의 순열이 아니거나,
   * 끝난 시즌이거나, 이미 픽이 있는 드래프트면 거부한다. 픽이 없는 드래프트는 다시 추첨(교체)할 수 있다.
   */
  startDraft(data: StartDraftData): Promise<Draft>;
  /**
   * 지금 차례인 팀의 픽 한 건. 차례가 아닌 팀, 이미 뽑힌 선수, 시즌 팀장, 끝났거나 없는 드래프트면 거부한다.
   * 픽은 시즌(`season`) 변경 이력에 남는다.
   */
  makeDraftPick(data: MakeDraftPickData): Promise<Draft>;
  /** 마지막 픽을 되돌린다(운영진). 픽이 없거나 끝난 드래프트면 거부한다 */
  undoDraftPick(seasonId: string, actorId?: string | null): Promise<Draft>;
  /** 드래프트를 끝낸다. 끝난 뒤에는 픽·되돌리기를 거부한다 */
  finishDraft(seasonId: string, actorId?: string | null): Promise<Draft>;
}
