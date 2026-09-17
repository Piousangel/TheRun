'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { ROLE_LABELS } from '@/entities/auth/model/labels';
import { useSignOut } from '@/entities/auth/model/queries';
import { useAuth } from '@/providers/auth-provider';
import { NAV_GROUPS, isNavItemActive, visibleGroups } from '@/shared/config/navigation';
import { cn } from '@/shared/lib/utils';
import { TheRunLogo } from '@/shared/ui/the-run-logo';

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { member, profile, isAdmin } = useAuth();
  const signOut = useSignOut();

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-border bg-background md:flex">
      <Link href="/dashboard" className="flex h-[52px] shrink-0 items-center gap-2 px-[18px]">
        <TheRunLogo className="h-7 w-7" />
        <span className="text-[15px] font-bold text-ink">The Run</span>
      </Link>

      <nav aria-label="사이드 메뉴" className="flex-1 overflow-y-auto px-3 pb-4">
        {visibleGroups(NAV_GROUPS, isAdmin).map((group) => (
          <div key={group.label ?? 'main'} className="mt-4 first:mt-1">
            {group.label && <p className="px-3 pb-1 text-xs font-bold text-ink-dim">{group.label}</p>}
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive = isNavItemActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex h-9 items-center gap-2.5 rounded-lg px-3 text-[14px]',
                        isActive ? 'bg-brand-soft font-semibold text-brand-dark' : 'text-ink-muted hover:bg-sunken',
                      )}
                    >
                      <Icon size={18} aria-hidden />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{member?.name ?? '이름 없음'}</p>
          {profile && <p className="text-xs text-ink-dim">{ROLE_LABELS[profile.role]}</p>}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signOut.isPending}
          aria-label="로그아웃"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-sunken disabled:opacity-50"
        >
          <LogOut size={18} aria-hidden />
        </button>
      </div>
    </aside>
  );
}
