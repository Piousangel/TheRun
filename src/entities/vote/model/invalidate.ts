import type { QueryClient } from '@tanstack/react-query';
import { attendanceKeys } from '@/entities/attendance/model/keys';
import { voteKeys } from '@/entities/vote/model/keys';

/**
 * 출석은 `type:'match'` 투표와 같은 데이터다(스펙 §1 출석→투표 흡수).
 * 그래서 투표 쓰기는 언제나 출석 캐시까지 함께 무효화해야 한다 —
 * 어느 한쪽이 빠지지 않도록 대상을 이 한 곳에 모아 둔다.
 */
export function invalidateVoteAndAttendance(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: voteKeys.all });
  queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
}
