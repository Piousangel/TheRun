import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-ring';

interface ListCardProps {
  href: string;
  title: ReactNode;
  badges?: ReactNode;
  trailing?: ReactNode;
  meta?: ReactNode;
  timestamp?: ReactNode;
  className?: string;
}

/** 전체가 Link인 목록 카드. 슬롯: badges / trailing / title / meta / timestamp */
export function ListCard({ href, title, badges, trailing, meta, timestamp, className }: ListCardProps) {
  return (
    <Link
      href={href}
      className={cn('flex min-h-[44px] flex-col gap-2 rounded-[14px] border border-border bg-background p-4 hover:bg-sunken', FOCUS, className)}
    >
      {(badges || trailing) && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">{badges}</div>
          {trailing}
        </div>
      )}
      <div className="text-[16px] font-semibold text-ink">{title}</div>
      {(meta || timestamp) && (
        <div className="flex items-center justify-between gap-2 text-[13px] text-ink-dim">
          <span className="min-w-0">{meta}</span>
          {timestamp && <span className="shrink-0 text-[12px] tabular-nums">{timestamp}</span>}
        </div>
      )}
    </Link>
  );
}

interface ListRowProps {
  href: string;
  title: ReactNode;
  leading?: ReactNode;
  badge?: ReactNode;
  meta?: ReactNode;
  className?: string;
}

/** 한 줄 목록 행(멤버 목록 등). */
export function ListRow({ href, title, leading, badge, meta, className }: ListRowProps) {
  return (
    <Link
      href={href}
      className={cn('flex min-h-[52px] items-center gap-3 rounded-[12px] border border-border bg-background px-4 py-3.5 hover:bg-sunken', FOCUS, className)}
    >
      {leading}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold text-ink">{title}</span>
          {badge}
        </span>
        {meta && <span className="block truncate text-[13px] text-ink-dim">{meta}</span>}
      </span>
      <ChevronRight size={18} aria-hidden className="shrink-0 text-ink-faint" />
    </Link>
  );
}
