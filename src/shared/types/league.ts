/** 리그전 도메인 (스펙 2026-11-15-owner-brief §2.2). 점수·순위는 이벤트에서 계산하고 저장하지 않는다. */

export type SeasonStatus = 'draft' | 'active' | 'done';
export type FixtureStatus = 'scheduled' | 'live' | 'final';
export type Tiebreaker = 'goal_diff' | 'goals_for' | 'head_to_head';
export type MvpMethod = 'member_vote' | 'admin_pick' | 'champion_vote';

export interface SeasonPoints {
  win: number;
  draw: number;
  loss: number;
}

export interface Season {
  id: string;
  name: string;
  starts_on: string; // YYYY-MM-DD
  ends_on: string;
  status: SeasonStatus;
  quarters_per_match: number;
  quarter_minutes: number;
  players_per_side: number;
  points: SeasonPoints;
  tiebreakers: Tiebreaker[];
  mvp_method: MvpMethod;
  created_at: string;
  updated_at: string;
}

export interface CreateSeasonData {
  name: string;
  starts_on: string;
  ends_on: string;
  quarters_per_match?: number;
  quarter_minutes?: number;
  players_per_side?: number;
  points?: SeasonPoints;
  tiebreakers?: Tiebreaker[];
  mvp_method?: MvpMethod;
}

export type UpdateSeasonData = Partial<Omit<Season, 'id' | 'created_at' | 'updated_at'>>;

export interface LeagueTeam {
  id: string;
  season_id: string;
  name: string;
  color: string;
  captain_member_id: string | null;
  created_at: string;
}

export interface CreateLeagueTeamData {
  season_id: string;
  name: string;
  color: string;
  captain_member_id?: string | null;
}

export type UpdateLeagueTeamData = Partial<Pick<LeagueTeam, 'name' | 'color' | 'captain_member_id'>>;

export interface Matchday {
  id: string;
  season_id: string;
  week: number; // 1..N
  date: string; // YYYY-MM-DD
  venue: string | null;
}

export interface Fixture {
  id: string;
  matchday_id: string;
  order: number; // 경기일 안 순서, 1부터
  home_team_id: string;
  away_team_id: string;
  status: FixtureStatus;
}

export interface GenerateScheduleInput {
  /** 첫 경기일 YYYY-MM-DD */
  first_date: string;
  /** 경기일 수. 기본 4 */
  weeks?: number;
  venue?: string | null;
}

/**
 * 골 이벤트(스펙 §2.2 GoalEvent). 점수·순위·개인 기록은 이 이벤트에서 계산한다.
 * - `team_id`는 득점이 인정된 팀이다. 자책골이면 득점자는 상대 팀 선수다.
 * - `id`는 클라이언트가 만들 수 있다(오프라인 재전송에도 중복이 생기지 않게).
 */
export interface GoalEvent {
  id: string;
  fixture_id: string;
  quarter: number; // 1..quarters_per_match
  team_id: string;
  scorer_id: string | null;
  assist_id: string | null;
  own_goal: boolean;
  created_by: string | null;
  created_at: string;
}

export interface AddGoalData {
  /** 클라이언트가 만든 UUID. 같은 id로 다시 보내면 기존 기록을 돌려준다(멱등). */
  id?: string;
  fixture_id: string;
  quarter: number;
  team_id: string;
  scorer_id?: string | null;
  assist_id?: string | null;
  own_goal?: boolean;
  /** 기록한 사람(감사 기록의 actor) */
  created_by?: string | null;
}

/**
 * 쿼터별 출전(스펙 §2.2 Appearance). "이 쿼터에 이 팀으로 뛰었다".
 * v1은 회원만 기록한다(게스트·임대 출전은 S2 뒤 항목). 출전 쿼터 수·개인 기록은 여기서 계산한다.
 */
export interface Appearance {
  id: string;
  fixture_id: string;
  quarter: number;
  team_id: string;
  member_id: string;
  created_at: string;
}

export interface SetLineupData {
  fixture_id: string;
  quarter: number;
  team_id: string;
  /** 이 쿼터에 이 팀으로 뛴 회원 전체. 기존 명단을 통째로 바꾼다(빈 배열이면 명단 삭제). */
  member_ids: string[];
  /** 바꾼 사람(감사 기록의 actor) */
  actor_id?: string | null;
}

/** 출전 명단 변경 감사 기록의 before/after 모양 */
export interface LineupAuditSnapshot {
  kind: 'lineup';
  quarter: number;
  team_id: string;
  member_ids: string[];
}

/**
 * 미니게임(스펙 §2.1-1 · §2.2 MiniGame/MiniGameResult). 승부차기·크로스바 맞히기처럼 경기와 따로 치르고,
 * 등수에 따라 시즌 순위표의 '미니게임 승점'을 준다. 승점은 저장하지 않고 등수와 `points`로 계산한다.
 */
export interface MiniGameResult {
  team_id: string;
  /** 1부터. 같은 등수(공동)도 허용한다 */
  rank: number;
}

export interface MiniGame {
  id: string;
  season_id: string;
  /** 어느 경기일에 하는지(선택) */
  matchday_id: string | null;
  name: string;
  description: string | null;
  /** 등수별 승점 [1위, 2위?, 3위?]. 기본 [1] — 우승만 1점(스펙 §5-3) */
  points: number[];
  /** 결과가 없으면 빈 배열(아직 안 함) */
  results: MiniGameResult[];
  created_at: string;
  updated_at: string;
}

export interface CreateMiniGameData {
  season_id: string;
  name: string;
  description?: string | null;
  matchday_id?: string | null;
  points?: number[];
  actor_id?: string | null;
}

export interface SetMiniGameResultsData {
  minigame_id: string;
  /** 결과 전체. 기존 결과를 통째로 바꾼다(빈 배열이면 결과 지우기) */
  results: MiniGameResult[];
  actor_id?: string | null;
}

/**
 * 참석 가능 주차(스펙 §2.1 · §2.2 Availability). 시즌 시작 전에 전원이 입력하고, 드래프트 선수 카드에 보인다.
 * 회원당 시즌 하나에 한 행이다(`id` = `${season_id}:${member_id}`). 빈 배열은 "한 주도 못 온다"이고, 행이 없으면 미입력이다.
 */
export interface Availability {
  id: string;
  season_id: string;
  member_id: string;
  /** 1부터 시작하는 주차, 오름차순·중복 없음 */
  weeks: number[];
  updated_at: string;
}

export interface SetAvailabilityData {
  season_id: string;
  member_id: string;
  /** 참석 가능한 주차 전체. 기존 값을 통째로 바꾼다 */
  weeks: number[];
  /** 입력한 사람(본인 또는 대신 입력한 운영진). 감사 기록의 actor */
  actor_id?: string | null;
}
