'use client';

import { useRouter } from 'next/navigation';
import { getApi } from '@/shared/api/client';
import { DEMO_ACCOUNTS, type DemoAccountKey } from '@/shared/api/ports/auth-repo';
import { Button } from '@/shared/ui/button';

const KEYS: DemoAccountKey[] = ['member', 'admin'];

/** 로컬 어댑터 전용 로그인 대체 수단. */
export function DemoLoginButtons({ nextPath }: { nextPath: string }) {
  const router = useRouter();

  const handleLogin = async (key: DemoAccountKey) => {
    await getApi().auth.signInAsDemo(key);
    router.push(nextPath);
    router.refresh();
  };

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4">
      <p className="text-sm font-medium">데모 모드 — 백엔드 없이 기기 안에서만 저장됩니다.</p>
      <div className="flex gap-2">
        {KEYS.map((key) => (
          <Button key={key} type="button" variant="outline" className="flex-1" onClick={() => handleLogin(key)}>
            {DEMO_ACCOUNTS[key].label}로 체험하기
          </Button>
        ))}
      </div>
    </div>
  );
}
