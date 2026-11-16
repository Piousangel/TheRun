import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

export type StatusTone = 'red' | 'amber' | 'blue' | 'green' | 'gray' | 'brand';

const TONE_CLASS: Record<StatusTone, string> = {
  red: 'bg-signal-red-bg text-signal-red-fg',
  amber: 'bg-signal-amber-bg text-signal-amber-fg',
  blue: 'bg-signal-blue-bg text-signal-blue-fg',
  green: 'bg-signal-green-bg text-signal-green-fg',
  gray: 'bg-signal-gray-bg text-signal-gray-fg',
  brand: 'bg-brand-soft text-brand-dark',
};

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
}

/** 도메인별 라벨 맵은 각 entity의 model/labels.ts에 두고, 배지는 tone만 받는다. */
export function StatusBadge({ tone = 'gray', className, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn('inline-flex h-5 items-center rounded-[10px] px-2 text-[12px] font-semibold', TONE_CLASS[tone], className)}
      {...props}
    />
  );
}
