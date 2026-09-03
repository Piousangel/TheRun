/** 투표 쿼리 키 팩토리. 무효화 헬퍼가 순환 import 없이 쓰도록 별도 모듈로 둔다. */
export const voteKeys = {
  all: ['votes'] as const,
  sessions: () => [...voteKeys.all, 'sessions'] as const,
  session: (id: string) => [...voteKeys.sessions(), id] as const,
  responses: () => [...voteKeys.all, 'responses'] as const,
  responsesBySession: (sessionId: string) => [...voteKeys.responses(), sessionId] as const,
  activeSessions: () => [...voteKeys.all, 'active-sessions'] as const,
};
