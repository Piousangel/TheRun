'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isShellHidden, resolveRouteMeta } from '@/shared/config/navigation';
import { DesktopSidebar } from '@/widgets/app-shell/ui/desktop-sidebar';
import { DesktopTopBar } from '@/widgets/app-shell/ui/desktop-top-bar';
import { MobileTabBar } from '@/widgets/app-shell/ui/mobile-tab-bar';
import { MobileTopBar } from '@/widgets/app-shell/ui/mobile-top-bar';

/**
 * 스크롤은 문서(window) 스크롤이다. 탭바는 fixed라서 <main> 하단 패딩으로 그 높이를 비운다.
 * 스펙 A-2 "스크롤 모델" 참고 — 옛 화면의 sticky/fixed·전술보드 좌표가 window 기준이다.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isShellHidden(pathname)) return <>{children}</>;

  const { kind } = resolveRouteMeta(pathname);

  return (
    <div className="min-h-dvh bg-background">
      <DesktopSidebar />
      <div className="md:pl-[232px]">
        <MobileTopBar />
        <DesktopTopBar />
        {kind === 'root' && <div aria-hidden className="md:hidden" style={{ height: 'env(safe-area-inset-top)' }} />}
        <main className="pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
      </div>
      <MobileTabBar />
    </div>
  );
}
