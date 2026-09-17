'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TAB_ITEMS, activeTabHref } from '@/shared/config/navigation';
import { cn } from '@/shared/lib/utils';

export function MobileTabBar() {
  const pathname = usePathname();
  const activeHref = activeTabHref(pathname);

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TAB_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px]',
              isActive ? 'font-bold text-brand-dark' : 'font-medium text-ink-muted',
            )}
          >
            <Icon size={22} aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
