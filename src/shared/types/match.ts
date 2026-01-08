export interface SubstitutionRecord {
  minute: number; // When the substitution happened (match minute)
  player_out_id: string; // Player leaving the field
  player_in_id: string; // Player entering the field
  timestamp: string; // ISO timestamp
}

export interface GoalRecord {
  minute: number; // When the goal was scored
  scorer_id: string; // Player who scored
  assist_id: string | null; // Player who assisted (null if no assist)
  timestamp: string; // ISO timestamp
}

export interface PlayerMatchRecord {
  member_id: string;
  goals: number;
  assists: number;
  saves: number; // Goalkeeper saves
  is_mvp: boolean;
}

export interface TeamMatchData {
  name: string; // "Team A", "Team B"
  member_ids: string[];
  score: number;
  players: PlayerMatchRecord[];
  goalkeeper_id: string | null; // Designated goalkeeper
  manager_id: string | null; // Team manager/coach
  substitutions: SubstitutionRecord[]; // Substitution history
  goals_detail: GoalRecord[]; // Detailed goal records
}

export interface Match {
  id: string;
  date: string;
  location: string;
  team_a: TeamMatchData;
  team_b: TeamMatchData;
  notes: string | null;
  vote_session_id: string | null;
  match_number: number | null;
  status: 'pending' | 'in_progress' | 'finished';
  start_time: string | null;
  end_time: string | null;
  duration: number | null; // in seconds
  created_at: string;
  updated_at: string;
}

export interface CreateMatchData {
  date: string;
  location: string;
  team_a: TeamMatchData;
  team_b: TeamMatchData;
  notes?: string;
  vote_session_id?: string;
  match_number?: number;
  status?: 'pending' | 'in_progress' | 'finished';
  start_time?: string;
  end_time?: string;
  duration?: number;
}

export interface UpdateMatchData {
  date?: string;
  location?: string;
  team_a?: TeamMatchData;
  team_b?: TeamMatchData;
  notes?: string;
  status?: 'pending' | 'in_progress' | 'finished';
  start_time?: string;
  end_time?: string;
  duration?: number;
}
