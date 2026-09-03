'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { getApi, resetLocalData } from '@/shared/api/client';
import { DEMO_ACCOUNTS, type DemoAccountKey } from '@/shared/api/ports/auth-repo';
import { cn } from '@/shared/lib/utils';

const ACCOUNT_KEYS: DemoAccountKey[] = ['member', 'admin', 'superadmin', 'unlinked'];

/** 로컬 어댑터 전용. 화면 우상단에 떠서 데모 계정을 바꾸거나 시드를 초기화한다. Supabase 모드에서는 렌더하지 않는다. */
export function DevRoleSwitcher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>, nextPath: string) => {
    setBusy(true);
    try {
      await action();
      queryClient.clear();
      router.push(nextPath);
      router.refresh();
    } catch (error) {
      // 시드에 없는 데모 계정 등으로 실제 throw가 난다. 조용히 삼키면 버튼이 먹통으로 보인다.
      toast.error(error instanceof Error ? error.message : '데모 세션 전환에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="group"
      aria-label="데모 계정 전환"
      className="fixed right-2 top-2 z-[60] flex flex-wrap items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 p-1 text-[11px] shadow"
    >
      <span className="px-1 font-semibold text-amber-800">DEMO</span>
      {ACCOUNT_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          disabled={busy}
          onClick={() => run(async () => { await getApi().auth.signInAsDemo(key); }, '/dashboard')}
          className={cn('rounded px-1.5 py-0.5 hover:bg-amber-200', busy && 'opacity-50')}
        >
          {DEMO_ACCOUNTS[key].label}
        </button>
      ))}
      <button type="button" disabled={busy} onClick={() => run(() => getApi().auth.signOut(), '/login')} className="rounded px-1.5 py-0.5 hover:bg-amber-200">
        로그아웃
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => run(async () => { await getApi().auth.signOut(); await resetLocalData(); }, '/login')}
        className="rounded px-1.5 py-0.5 text-red-700 hover:bg-red-100"
      >
        데이터 초기화
      </button>
    </div>
  );
}
