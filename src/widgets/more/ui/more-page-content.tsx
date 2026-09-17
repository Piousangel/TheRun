'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { ROLE_LABELS } from '@/entities/auth/model/labels';
import { useSignOut } from '@/entities/auth/model/queries';
import { useAuth } from '@/providers/auth-provider';
import { MORE_GROUPS, visibleGroups } from '@/shared/config/navigation';
import { GroupedList, GroupedListItem } from '@/shared/ui/grouped-list';

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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[19px] font-bold text-ink">더보기</h1>

      <div className="flex items-center gap-3 rounded-2xl bg-brand-soft p-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-bold text-ink">
          {member?.name.slice(0, 1) ?? '?'}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-ink">{member?.name ?? '이름 없음'}</p>
          {profile && <p className="text-sm text-brand-dark">{ROLE_LABELS[profile.role]}</p>}
        </div>
      </div>

      {groups.map((group) => (
        <GroupedList key={group.label ?? 'main'} label={group.label ?? undefined}>
          {group.items.map((item) => (
            <GroupedListItem key={item.href} icon={item.icon} label={item.label} href={item.href} />
          ))}
          {group.label === '계정' && (
            <GroupedListItem icon={LogOut} label="로그아웃" tone="danger" onClick={handleSignOut} disabled={signOut.isPending} />
          )}
        </GroupedList>
      ))}
    </div>
  );
}
