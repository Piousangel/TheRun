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
        {/* 탭바 콘텐츠 높이(--tabbar-h)에 border-t 1px이 더해진다. 1px을 빼면
            서브픽셀 레이아웃에서 마지막 콘텐츠가 탭바 아래로 들어갈 수 있다. */}
        <main className="pb-[calc(var(--tabbar-h)+1px+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
      </div>
      <MobileTabBar />
    </div>
  );
}
