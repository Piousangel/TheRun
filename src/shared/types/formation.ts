export type FormationType = '6v6' | '7v7' | '8v8';
export type PositionRole = 'GK' | 'DF' | 'MF' | 'FW';

export interface PlayerPosition {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  role: PositionRole;
}

export interface Formation {
  id: string;
  name: string;
  formation_type: FormationType;
  positions: Record<string, PlayerPosition>; // member_id -> position
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFormationData {
  name: string;
  formation_type: FormationType;
  positions: Record<string, PlayerPosition>;
  notes?: string;
}

export interface UpdateFormationData {
  name?: string;
  formation_type?: FormationType;
  positions?: Record<string, PlayerPosition>;
  notes?: string;
}
