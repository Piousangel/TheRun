'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { resolveRouteMeta } from '@/shared/config/navigation';
import { usePageHeaderStore } from '@/shared/lib/page-header/store';
import { TheRunLogo } from '@/shared/ui/the-run-logo';

export function MobileTopBar() {
  const pathname = usePathname();
  const { member } = useAuth();
  const override = usePageHeaderStore((state) => state.override);
  const meta = resolveRouteMeta(pathname);

  if (meta.kind === 'root') return null;

  const title = override?.title ?? meta.title;
  const subtitle = override?.subtitle;
  const backHref = override?.backHref ?? meta.backHref;

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background px-3 md:hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(3.5rem + env(safe-area-inset-top))' }}
    >
      {meta.kind === 'home' ? (
        <>
          <TheRunLogo className="ml-1 h-7 w-7" />
          <span className="text-[17px] font-bold text-ink">The Run</span>
          {member && (
            <span className="ml-auto rounded-full bg-brand-soft px-3 py-1 text-sm font-bold text-brand-dark">
              {member.name}님
            </span>
          )}
        </>
      ) : (
        <>
          {backHref && (
            <Link href={backHref} aria-label="뒤로" className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center text-ink">
              <ChevronLeft size={22} aria-hidden />
            </Link>
          )}
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold leading-tight text-ink">{title}</p>
            {subtitle && <p className="truncate text-xs text-ink-dim">{subtitle}</p>}
          </div>
        </>
      )}
    </header>
  );
}
