'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, FlaskConical, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { ROLE_LABELS } from '@/entities/auth/model/labels';
import { useSignOut } from '@/entities/auth/model/queries';
import { DemoSheet } from '@/features/dev-session/ui/demo-sheet';
import { useAuth } from '@/providers/auth-provider';
import { isLocalAdapter } from '@/shared/api/client';
import { MORE_GROUPS, visibleGroups } from '@/shared/config/navigation';
import { cn } from '@/shared/lib/utils';
import { GroupedList, GroupedListButton, GroupedListItem } from '@/shared/ui/grouped-list';

export function MorePageContent() {
  const router = useRouter();
  const { member, profile, isAdmin } = useAuth();
  const signOut = useSignOut();
  const groups = visibleGroups(MORE_GROUPS, isAdmin);

  const handleSignOut = async () => {
    try {
      await signOut.mutateAsync();
      router.push('/login');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '로그아웃에 실패했습니다.');
    }
  };

  const profileBody = (
    <>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-ink">
        {member?.name.slice(0, 1) ?? '?'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-base font-bold text-ink">{member?.name ?? '이름 없음'}</span>
          {profile && (
            <span className="shrink-0 rounded-[10px] bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-dark">
              {ROLE_LABELS[profile.role]}
            </span>
          )}
        </span>
        {!member && <span className="mt-0.5 block text-sm text-ink-dim">멤버 연결이 필요합니다</span>}
      </span>
    </>
  );

  const profileCardClass = 'flex items-center gap-3 rounded-[14px] border border-border bg-background p-4';

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[19px] font-bold text-ink md:hidden">더보기</h1>

      {member ? (
        <div className={profileCardClass}>{profileBody}</div>
      ) : (
        <Link
          href="/me"
          className={cn(profileCardClass, 'outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring')}
        >
          {profileBody}
          <ChevronRight size={18} aria-hidden className="shrink-0 text-ink-faint" />
        </Link>
      )}

      {groups.map((group) => (
        <GroupedList key={group.label ?? 'main'} label={group.label ?? undefined}>
          {group.items.map((item) => (
            <GroupedListItem key={item.href} icon={item.icon} label={item.label} href={item.href} />
          ))}
          {group.label === '계정' && (
            <>
              {isLocalAdapter() && (
                <li>
                  <DemoSheet>
                    <GroupedListButton icon={FlaskConical} label="데모 모드" />
                  </DemoSheet>
                </li>
              )}
              <GroupedListItem icon={LogOut} label="로그아웃" tone="danger" onClick={handleSignOut} disabled={signOut.isPending} />
            </>
          )}
        </GroupedList>
      ))}
    </div>
  );
}
