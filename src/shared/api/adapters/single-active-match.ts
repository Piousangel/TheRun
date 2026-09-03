import type { VoteRepo } from '@/shared/api/ports/vote-repo';

/**
 * "활성 경기(match) 투표 세션은 언제나 최대 하나"라는 불변식을 리포 레벨에서 한 번만 강제한다.
 *
 * 출석 화면과 투표 화면 두 쓰기 경로가 같은 테이블을 쓰는데 훅마다 규칙을 두면 한쪽이 빠진다.
 * 어댑터별로 로직을 복제하지 않도록 포트를 감싸는 데코레이터로 두고, 두 어댑터가 같은 것을 쓴다.
 * 계약 테스트(`contracts/vote-repo.contract.ts`)가 이 불변식을 검증한다.
 */
export function withSingleActiveMatchSession(repo: VoteRepo): VoteRepo {
  return {
    ...repo,
    async createSession(data) {
      if (data.type === 'match') {
        const active = await repo.listActiveSessions();
        // 순차로 닫는다. 두 어댑터 모두 read-modify-write라 동시에 갱신하면 나중 쓰기가 앞 쓰기를 지운다.
        for (const session of active.filter((s) => s.type === 'match')) {
          await repo.updateSession(session.id, { is_active: false });
        }
      }
      return repo.createSession(data);
    },
  };
}
