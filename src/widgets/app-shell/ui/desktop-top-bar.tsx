'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { resolveRouteMeta } from '@/shared/config/navigation';
import { usePageHeaderStore } from '@/shared/lib/page-header/store';

export function DesktopTopBar() {
  const pathname = usePathname();
  const override = usePageHeaderStore((state) => state.override);
  const meta = resolveRouteMeta(pathname);
  const title = override?.title ?? meta.title;
  const subtitle = override?.subtitle;
  const backHref = meta.kind === 'deep' ? (override?.backHref ?? meta.backHref) : null;

  return (
    <header className="sticky top-0 z-20 hidden h-[52px] items-center gap-2 border-b border-border bg-background px-6 md:flex">
      {backHref && (
        <Link href={backHref} aria-label="뒤로" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-lg text-ink-muted hover:bg-sunken">
          <ChevronLeft size={20} aria-hidden />
        </Link>
      )}
      <div className="flex min-w-0 items-baseline gap-2">
        <p className="truncate text-[15px] font-bold text-ink">{title}</p>
        {subtitle && <p className="truncate text-xs text-ink-dim">{subtitle}</p>}
      </div>
    </header>
  );
}
