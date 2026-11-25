'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getApi } from '@/shared/api/client';
import { drainGoalQueue, isOffline, useGoalQueue, type DrainResult } from '@/entities/league/model/goal-queue';
import { leagueKeys } from '@/entities/league/model/keys';

// 같은 탭에서 동시에 두 번 보내지 않게 한다(재전송해도 멱등이지만 감사 기록·요청을 아낀다).
let inFlight: Promise<DrainResult | null> | null = null;

/**
 * 골 오프라인 큐 동기화. 화면이 붙어 있는 동안
 * - 처음 붙을 때, 연결이 돌아올 때(`online`), 탭이 다시 보일 때 자동으로 보낸다.
 * - `flush()`로 사람이 바로 보낼 수도 있다('지금 보내기').
 */
export function useGoalSync() {
  const queryClient = useQueryClient();
  const items = useGoalQueue((s) => s.items);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const flush = useCallback(async (): Promise<DrainResult | null> => {
    if (isOffline()) return null;
    if (inFlight) return inFlight;
    const { items: queued, remove, markFailed } = useGoalQueue.getState();
    if (!queued.some((i) => !i.error)) return null;
    setSyncing(true);
    inFlight = (async () => {
      const result = await drainGoalQueue(queued, (item) => getApi().league.addGoal(item.data));
      for (const item of result.sent) remove(item.data.id);
      for (const { item, error } of result.rejected) markFailed(item.data.id, error);
      const touched = new Set([...result.sent, ...result.rejected.map((r) => r.item)].map((i) => i.seasonId));
      const fixtures = new Set([...result.sent].map((i) => i.data.fixture_id));
      await Promise.all([
        ...[...touched].map((id) => queryClient.invalidateQueries({ queryKey: leagueKeys.goals(id) })),
        ...[...fixtures].map((id) => queryClient.invalidateQueries({ queryKey: leagueKeys.fixtureHistory(id) })),
      ]);
      return result;
    })();
    try {
      return await inFlight;
    } finally {
      inFlight = null;
      setSyncing(false);
    }
  }, [queryClient]);

  useEffect(() => {
    setOnline(!isOffline());
    const handleOnline = () => {
      setOnline(true);
      void flush();
    };
    const handleOffline = () => setOnline(false);
    const handleVisible = () => {
      if (document.visibilityState === 'visible') void flush();
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisible);
    void flush();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, [flush]);

  return {
    items,
    pending: items.filter((i) => !i.error),
    failed: items.filter((i) => !!i.error),
    online,
    syncing,
    flush,
  };
}
