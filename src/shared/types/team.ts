import { MemberStats } from './member';

export interface TeamStats {
  avgSpeed: number;
  avgShooting: number;
  avgPassing: number;
  avgDribbling: number;
  avgStamina: number;
  avgDefense: number;
  totalScore: number;
}

export interface TeamData {
  memberIds: string[];
  stats: TeamStats;
}

export interface TeamDivision {
  id: string;
  date: string;
  team_a: TeamData;
  team_b: TeamData;
  method: 'manual' | 'auto';
  created_at: string;
}

export interface CreateTeamDivisionData {
  date: string;
  team_a: TeamData;
  team_b: TeamData;
  method: 'manual' | 'auto';
}
