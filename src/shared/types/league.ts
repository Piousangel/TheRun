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
