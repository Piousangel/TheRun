'use client';

import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { getApi, resetLocalData } from '@/shared/api/client';
import { DEMO_ACCOUNTS, type DemoAccountKey } from '@/shared/api/ports/auth-repo';
import { Button } from '@/shared/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/shared/ui/drawer';

const ACCOUNT_KEYS: DemoAccountKey[] = ['member', 'admin', 'superadmin', 'unlinked'];

/**
 * 로컬 어댑터 전용 데모 시트: 데모 계정 전환·로그아웃·데이터 초기화.
 * 트리거는 children으로 받는다(모바일 홈 헤더 DEMO 배지, /more 계정 그룹 행, 데스크톱 사이드바 행).
 * 콘텐츠 위에 떠 있는 요소를 두지 않기 위해 자체 floating 칩은 없다.
 * 호출하는 쪽이 isLocalAdapter()일 때만 렌더한다.
 */
export function DemoSheet({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const run = async (action: () => Promise<void>, nextPath: string) => {
    setBusy(true);
    try {
      await action();
      queryClient.clear();
      setOpen(false);
      router.push(nextPath);
      router.refresh();
    } catch (error) {
      // 시드에 없는 데모 계정 등으로 실제 throw가 난다. 조용히 삼키면 버튼이 먹통으로 보인다.
      toast.error(error instanceof Error ? error.message : '데모 세션 전환에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setConfirmReset(false);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>데모 모드</DrawerTitle>
          <DrawerDescription>화면 미리보기입니다. 입력한 내용은 이 기기에만 남고 다른 사람에게 보이지 않습니다.</DrawerDescription>
        </DrawerHeader>

        <div className="mt-4 space-y-5">
          <section className="space-y-2">
            <h3 className="text-xs font-bold text-ink-dim">계정 전환</h3>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_KEYS.map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  className="h-11"
                  disabled={busy}
                  onClick={() => run(async () => { await getApi().auth.signInAsDemo(key); }, '/dashboard')}
                >
                  {DEMO_ACCOUNTS[key].label}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <Button variant="outline" className="h-11 w-full" disabled={busy} onClick={() => run(() => getApi().auth.signOut(), '/login')}>
              로그아웃
            </Button>
            {confirmReset ? (
              <div className="space-y-2 rounded-xl bg-signal-red-bg p-3">
                <p className="text-sm text-signal-red-fg">시드 데이터로 되돌리고 로그아웃합니다.</p>
                <Button
                  variant="destructive"
                  className="h-11 w-full"
                  disabled={busy}
                  onClick={() => run(async () => { await getApi().auth.signOut(); await resetLocalData(); }, '/login')}
                >
                  초기화 실행
                </Button>
              </div>
            ) : (
              <Button variant="ghost" className="h-11 w-full text-signal-red-fg" disabled={busy} onClick={() => setConfirmReset(true)}>
                데이터 초기화
              </Button>
            )}
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
