'use client';

import { cn } from '@/shared/lib/utils';

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  ariaLabel: string;
  className?: string;
}

/** 2~3개 옵션 전환. 활성 옵션은 흰 카드, 트랙은 --bg-sunken. */
export function SegmentedControl<T extends string>({ value, onChange, options, ariaLabel, className }: SegmentedControlProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('flex w-full gap-1 rounded-[12px] bg-sunken-strong p-1', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'min-h-[44px] flex-1 rounded-[9px] px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active ? 'bg-background text-ink' : 'text-ink-dim hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
