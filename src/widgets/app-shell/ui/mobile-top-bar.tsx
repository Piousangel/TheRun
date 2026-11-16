'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { DemoSheet } from '@/features/dev-session/ui/demo-sheet';
import { useAuth } from '@/providers/auth-provider';
import { isLocalAdapter } from '@/shared/api/client';
import { resolveRouteMeta } from '@/shared/config/navigation';
import { usePageHeaderStore } from '@/shared/lib/page-header/store';
import { TheRunBadge } from '@/shared/ui/the-run-logo';

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
          <TheRunBadge className="ml-1" />
          <span className="text-[17px] font-bold text-ink">The Run</span>
          {isLocalAdapter() && (
            <DemoSheet>
              <button
                type="button"
                aria-label="데모 메뉴 열기"
                className="flex h-11 items-center rounded-lg px-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="rounded-[10px] bg-signal-amber-bg px-2 py-0.5 text-[11px] font-bold text-signal-amber-fg">DEMO</span>
              </button>
            </DemoSheet>
          )}
          {member && (
            <Link
              href="/me"
              className="ml-auto flex h-11 min-w-0 max-w-[45%] items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span className="truncate rounded-full bg-brand-soft px-3 py-1 text-sm font-bold text-brand-dark">{member.name}님</span>
            </Link>
          )}
        </>
      ) : (
        <>
          {backHref && (
            <Link href={backHref} aria-label="뒤로" className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
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
