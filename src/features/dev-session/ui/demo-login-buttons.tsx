'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { getApi } from '@/shared/api/client';
import { DEMO_ACCOUNTS, type DemoAccountKey } from '@/shared/api/ports/auth-repo';
import { safeInternalPath } from '@/shared/lib/navigation';
import { Button } from '@/shared/ui/button';

const KEYS: DemoAccountKey[] = ['member', 'admin'];

/** 로컬 어댑터 전용 로그인 대체 수단. */
export function DemoLoginButtons({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleLogin = async (key: DemoAccountKey) => {
    setBusy(true);
    try {
      await getApi().auth.signInAsDemo(key);
      // next는 사용자가 준 값이다. 외부 URL로 이탈하지 않도록 내부 경로만 허용한다.
      router.push(safeInternalPath(nextPath));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '데모 로그인에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4">
      <p className="text-sm font-medium">데모 모드 — 백엔드 없이 기기 안에서만 저장됩니다.</p>
      <div className="flex gap-2">
        {KEYS.map((key) => (
          <Button key={key} type="button" variant="outline" className="flex-1" disabled={busy} onClick={() => handleLogin(key)}>
            {DEMO_ACCOUNTS[key].label}로 체험하기
          </Button>
        ))}
      </div>
    </div>
  );
}
