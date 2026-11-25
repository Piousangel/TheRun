import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AddGoalData, GoalEvent } from '@/shared/types/league';

/**
 * 골 기록 오프라인 큐(스펙 §2.3 "기록은 기기에 먼저 저장하고 연결되면 동기화한다").
 * - 연결이 없을 때 남긴 골은 여기에 쌓이고 localStorage에 남는다(새로고침·앱 재시작에도 유지).
 * - 연결되면 순서대로 보낸다. 골 id는 클라이언트 UUID라 재전송해도 중복이 생기지 않는다(addGoal 멱등).
 * - 서버가 거부한 기록(경기가 끝남 등)은 지우지 않고 '실패'로 남겨 사람이 보고 버리게 한다. 조용히 사라지면 안 된다.
 */
export interface QueuedGoal {
  seasonId: string;
  data: AddGoalData & { id: string };
  queued_at: string;
  /** 서버가 거부한 이유. 있으면 다시 보내지 않는다. */
  error?: string;
}

interface GoalQueueState {
  items: QueuedGoal[];
  enqueue: (item: QueuedGoal) => void;
  remove: (id: string) => void;
  markFailed: (id: string, error: string) => void;
}

export const GOAL_QUEUE_STORAGE_KEY = 'therun:goal-queue';

export const useGoalQueue = create<GoalQueueState>()(
  persist(
    (set) => ({
      items: [],
      enqueue: (item) =>
        set((s) => (s.items.some((i) => i.data.id === item.data.id) ? s : { items: [...s.items, item] })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.data.id !== id) })),
      markFailed: (id, error) => set((s) => ({ items: s.items.map((i) => (i.data.id === id ? { ...i, error } : i)) })),
    }),
    { name: GOAL_QUEUE_STORAGE_KEY, storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

/** 지금 연결이 없다고 볼 수 있는가. 서버 밖(브라우저)에서만 의미가 있다. */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/**
 * 연결 문제로 실패했는가(다시 보내면 될 수 있는가), 아니면 서버가 거부했는가.
 * fetch 실패는 TypeError('Failed to fetch' / 'Load failed' / 'NetworkError ...')로 온다.
 */
export function isNetworkError(error: unknown): boolean {
  if (isOffline()) return true;
  if (error instanceof TypeError) return true;
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  return /failed to fetch|load failed|network ?error|networkerror|fetch failed|timed? ?out/i.test(message);
}

/** 화면 표시용: 아직 보내지 않은 골을 서버 골과 같은 모양으로. */
export function queuedToGoalEvent(item: QueuedGoal): GoalEvent {
  const { data } = item;
  return {
    id: data.id,
    fixture_id: data.fixture_id,
    quarter: data.quarter,
    team_id: data.team_id,
    scorer_id: data.scorer_id ?? null,
    assist_id: data.own_goal ? null : (data.assist_id ?? null),
    own_goal: data.own_goal ?? false,
    created_by: data.created_by ?? null,
    created_at: item.queued_at,
  };
}

/** 서버 골 + 대기 중인 골(실패 제외, 이미 서버에 있는 id 제외). 점수·타임라인은 이 목록으로 그린다. */
export function mergeQueuedGoals(goals: GoalEvent[], queue: QueuedGoal[], seasonId: string): GoalEvent[] {
  const known = new Set(goals.map((g) => g.id));
  const pending = queue.filter((i) => i.seasonId === seasonId && !i.error && !known.has(i.data.id)).map(queuedToGoalEvent);
  return pending.length === 0 ? goals : [...goals, ...pending];
}

export interface DrainResult {
  /** 보낸(또는 이미 서버에 있던) 기록 */
  sent: QueuedGoal[];
  /** 서버가 거부한 기록과 이유 */
  rejected: { item: QueuedGoal; error: string }[];
  /** 연결이 끊겨 멈췄는가. 남은 기록은 그대로 둔다. */
  stoppedOffline: boolean;
}

/**
 * 대기 기록을 순서대로 보낸다. 연결 오류가 나면 그 자리에서 멈춘다(순서 유지, 다음 기회에 다시).
 * 서버 거부는 그 건만 실패로 두고 계속한다. 실패로 표시된 건 건너뛴다.
 */
export async function drainGoalQueue(
  items: QueuedGoal[],
  send: (item: QueuedGoal) => Promise<unknown>,
): Promise<DrainResult> {
  const result: DrainResult = { sent: [], rejected: [], stoppedOffline: false };
  for (const item of items) {
    if (item.error) continue;
    try {
      await send(item);
      result.sent.push(item);
    } catch (e) {
      if (isNetworkError(e)) {
        result.stoppedOffline = true;
        break;
      }
      result.rejected.push({ item, error: e instanceof Error ? e.message : '기록을 보내지 못했습니다.' });
    }
  }
  return result;
}
