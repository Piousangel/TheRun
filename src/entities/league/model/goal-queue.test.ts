import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  drainGoalQueue,
  isNetworkError,
  mergeQueuedGoals,
  useGoalQueue,
  type QueuedGoal,
} from '@/entities/league/model/goal-queue';
import type { GoalEvent } from '@/shared/types/league';

const item = (id: string, extra: Partial<QueuedGoal> = {}): QueuedGoal => ({
  seasonId: 's1',
  data: { id, fixture_id: 'f1', quarter: 1, team_id: 't1', scorer_id: 'm1', assist_id: null },
  queued_at: '2026-11-25T06:31:00.000Z',
  ...extra,
});

const serverGoal = (id: string): GoalEvent => ({
  id,
  fixture_id: 'f1',
  quarter: 1,
  team_id: 't1',
  scorer_id: 'm1',
  assist_id: null,
  own_goal: false,
  created_by: null,
  created_at: '2026-11-25T06:30:00.000Z',
});

describe('isNetworkError', () => {
  afterEach(() => vi.restoreAllMocks());

  it('fetch 실패(TypeError)와 네트워크 메시지는 연결 오류다', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
    expect(isNetworkError(new Error('Load failed'))).toBe(true);
    expect(isNetworkError(new Error('NetworkError when attempting to fetch resource.'))).toBe(true);
  });

  it('서버가 거부한 도메인 오류는 연결 오류가 아니다', () => {
    expect(isNetworkError(new Error('경기를 시작한 뒤에 골을 기록할 수 있습니다.'))).toBe(false);
  });

  it('브라우저가 오프라인이면 어떤 오류든 연결 오류로 본다', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(isNetworkError(new Error('경기를 시작한 뒤에 골을 기록할 수 있습니다.'))).toBe(true);
  });
});

describe('mergeQueuedGoals', () => {
  it('대기 골을 서버 골 뒤에 붙인다(같은 시즌만)', () => {
    const merged = mergeQueuedGoals([serverGoal('a')], [item('b'), item('c', { seasonId: 's2' })], 's1');
    expect(merged.map((g) => g.id)).toEqual(['a', 'b']);
    expect(merged[1]).toMatchObject({ scorer_id: 'm1', own_goal: false, created_at: '2026-11-25T06:31:00.000Z' });
  });

  it('이미 서버에 있는 id와 실패한 기록은 빼서 점수가 두 번 세지지 않는다', () => {
    const merged = mergeQueuedGoals([serverGoal('a')], [item('a'), item('x', { error: '거부' })], 's1');
    expect(merged.map((g) => g.id)).toEqual(['a']);
  });
});

describe('drainGoalQueue', () => {
  it('순서대로 보내고 모두 성공하면 전부 sent', async () => {
    const order: string[] = [];
    const result = await drainGoalQueue([item('a'), item('b')], async (i) => {
      order.push(i.data.id);
    });
    expect(order).toEqual(['a', 'b']);
    expect(result.sent.map((i) => i.data.id)).toEqual(['a', 'b']);
    expect(result.stoppedOffline).toBe(false);
  });

  it('연결 오류가 나면 그 자리에서 멈추고 뒤 기록은 보내지 않는다', async () => {
    const send = vi.fn(async (i: QueuedGoal) => {
      if (i.data.id === 'b') throw new TypeError('Failed to fetch');
    });
    const result = await drainGoalQueue([item('a'), item('b'), item('c')], send);
    expect(send).toHaveBeenCalledTimes(2);
    expect(result.sent.map((i) => i.data.id)).toEqual(['a']);
    expect(result.stoppedOffline).toBe(true);
  });

  it('서버 거부는 그 건만 rejected로 두고 계속 보낸다. 이미 실패한 건은 건너뛴다', async () => {
    const send = vi.fn(async (i: QueuedGoal) => {
      if (i.data.id === 'b') throw new Error('경기를 시작한 뒤에 골을 기록할 수 있습니다.');
    });
    const result = await drainGoalQueue([item('x', { error: '예전 실패' }), item('a'), item('b'), item('c')], send);
    expect(send).toHaveBeenCalledTimes(3);
    expect(result.sent.map((i) => i.data.id)).toEqual(['a', 'c']);
    expect(result.rejected).toEqual([{ item: expect.objectContaining({ data: expect.objectContaining({ id: 'b' }) }), error: '경기를 시작한 뒤에 골을 기록할 수 있습니다.' }]);
  });
});

describe('useGoalQueue', () => {
  beforeEach(() => useGoalQueue.setState({ items: [] }));

  it('같은 id는 한 번만 쌓고, 실패 표시·제거를 한다. localStorage에 남는다', () => {
    const { enqueue, markFailed, remove } = useGoalQueue.getState();
    enqueue(item('a'));
    enqueue(item('a'));
    enqueue(item('b'));
    expect(useGoalQueue.getState().items.map((i) => i.data.id)).toEqual(['a', 'b']);
    markFailed('b', '거부');
    expect(useGoalQueue.getState().items[1].error).toBe('거부');
    remove('a');
    expect(useGoalQueue.getState().items.map((i) => i.data.id)).toEqual(['b']);
    expect(JSON.parse(localStorage.getItem('therun:goal-queue') ?? '{}').state.items).toHaveLength(1);
  });
});
