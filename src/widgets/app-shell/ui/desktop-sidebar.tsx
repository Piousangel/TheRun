'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FlaskConical, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { ROLE_LABELS } from '@/entities/auth/model/labels';
import { useSignOut } from '@/entities/auth/model/queries';
import { DemoSheet } from '@/features/dev-session/ui/demo-sheet';
import { useAuth } from '@/providers/auth-provider';
import { isLocalAdapter } from '@/shared/api/client';
import { NAV_GROUPS, isNavItemActive, visibleGroups } from '@/shared/config/navigation';
import { cn } from '@/shared/lib/utils';
import { TheRunLogo } from '@/shared/ui/the-run-logo';

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring';

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { member, profile, isAdmin } = useAuth();
  const signOut = useSignOut();

  const handleSignOut = async () => {
    try {
      await signOut.mutateAsync();
      router.push('/login');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '로그아웃에 실패했습니다.');
    }
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
                        'flex h-11 items-center gap-2.5 rounded-lg px-3 text-[14px]',
                        FOCUS_RING,
                        isActive ? 'bg-brand-soft font-semibold text-brand-dark' : 'text-ink-muted hover:bg-sunken-strong hover:text-ink',
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

      {isLocalAdapter() && (
        <div className="border-t border-border px-3 pt-2">
          <DemoSheet>
            <button
              type="button"
              className={cn(
                'flex h-11 w-full items-center gap-2.5 rounded-lg px-3 text-[14px] font-semibold text-signal-amber-fg hover:bg-sunken-strong hover:text-ink',
                FOCUS_RING,
              )}
            >
              <FlaskConical size={18} aria-hidden />
              데모 모드
            </button>
          </DemoSheet>
        </div>
      )}

      <div className={cn('flex items-center gap-2 px-4 py-3', !isLocalAdapter() && 'border-t border-border')}>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{member?.name ?? '이름 없음'}</p>
          {profile && <p className="text-xs text-ink-dim">{ROLE_LABELS[profile.role]}</p>}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signOut.isPending}
          aria-label="로그아웃"
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-lg text-ink-muted hover:bg-sunken-strong hover:text-ink disabled:opacity-50',
            FOCUS_RING,
          )}
        >
          <LogOut size={18} aria-hidden />
        </button>
      </div>
    </aside>
  );
}
