import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface AppPageLayoutProps {
  children: ReactNode;
  /** content: 목록·대시보드(1120px) / narrow: 폼·문서(768px) */
  width?: 'content' | 'narrow';
  className?: string;
}

/** 셸 <main> 안에서 페이지 여백과 최대 너비만 잡는다. <main>은 AppShell이 가진다. */
export function AppPageLayout({ children, width = 'content', className }: AppPageLayoutProps) {
  return (
    <div className={cn('px-4 py-4 md:px-6 md:py-6', className)}>
      <div className={cn('mx-auto', width === 'content' ? 'max-w-[1120px]' : 'max-w-3xl')}>{children}</div>
    </div>
  );
}
