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
