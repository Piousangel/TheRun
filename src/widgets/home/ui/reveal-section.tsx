'use client';

import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { useScrollReveal } from '../model/use-scroll-reveal';

interface RevealSectionProps {
  children: ReactNode;
  className?: string;
}

export function RevealSection({ children, className }: RevealSectionProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-10 opacity-0 blur-[2px]',
        className
      )}
    >
      {children}
    </div>
  );
}
