export interface AttendanceVote {
  id: string;
  match_date: string; // 토요일 날짜
  deadline: string; // 금요일 자정
  member_id: string;
  status: 'attending' | 'absent';
  created_at: string;
  updated_at: string;
}

export interface AttendanceSession {
  id: string;
  match_date: string;
  deadline: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateAttendanceVoteData {
  match_date: string;
  member_id: string;
  status: 'attending' | 'absent';
}

export interface UpdateAttendanceVoteData {
  status: 'attending' | 'absent';
}
