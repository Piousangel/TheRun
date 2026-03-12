import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface AppPageLayoutProps {
  children: ReactNode;
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | '7xl';
  className?: string;
}

const maxWidthClassMap: Record<NonNullable<AppPageLayoutProps['maxWidth']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '7xl': 'max-w-7xl',
};

export function AppPageLayout({ children, maxWidth = '7xl', className }: AppPageLayoutProps) {
  return (
    <main className={cn('min-h-screen p-4 sm:p-8', className)}>
      <div className={cn('mx-auto', maxWidthClassMap[maxWidth])}>{children}</div>
    </main>
  );
}
