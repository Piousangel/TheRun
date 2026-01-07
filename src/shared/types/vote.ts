export type VoteType = 'match' | 'dining' | 'outing' | 'other';

export interface VoteSession {
  id: string;
  title: string;
  description: string | null;
  type: VoteType;
  event_date: string;
  deadline: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VoteResponse {
  id: string;
  session_id: string;
  member_id: string;
  status: 'attending' | 'absent';
  created_at: string;
  updated_at: string;
}

export interface CreateVoteSessionData {
  title: string;
  description?: string;
  type: VoteType;
  event_date: string;
  deadline: string;
}

export interface UpdateVoteSessionData {
  title?: string;
  description?: string;
  type?: VoteType;
  event_date?: string;
  deadline?: string;
  is_active?: boolean;
}
