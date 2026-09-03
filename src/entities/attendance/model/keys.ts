/** 출석 쿼리 키 팩토리. 무효화 헬퍼가 순환 import 없이 쓰도록 별도 모듈로 둔다. */
export const attendanceKeys = {
  all: ['attendance'] as const,
  sessions: () => [...attendanceKeys.all, 'sessions'] as const,
  session: (id: string) => [...attendanceKeys.sessions(), id] as const,
  votes: () => [...attendanceKeys.all, 'votes'] as const,
  votesBySession: (sessionId: string) => [...attendanceKeys.votes(), sessionId] as const,
  currentSession: () => [...attendanceKeys.all, 'current-session'] as const,
};
