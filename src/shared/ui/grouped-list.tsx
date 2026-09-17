import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export function GroupedList({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      {label && <h2 className="px-1 text-xs font-bold text-ink-dim">{label}</h2>}
      <ul className="divide-y divide-border overflow-hidden rounded-[14px] border border-border bg-background">{children}</ul>
    </section>
  );
}

interface RowContentProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  tone?: 'default' | 'danger';
}

const ROW_CLASS =
  'flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-50';

function RowContent({ icon: Icon, label, description, tone = 'default', chevron }: RowContentProps & { chevron: boolean }) {
  return (
    <>
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-sunken-strong">
        <Icon size={18} aria-hidden className={tone === 'danger' ? 'text-signal-red-fg' : 'text-ink-muted'} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-[15px] font-semibold', tone === 'danger' ? 'text-signal-red-fg' : 'text-ink')}>{label}</span>
        {description && <span className="block text-xs text-ink-dim">{description}</span>}
      </span>
      {chevron && <ChevronRight size={18} aria-hidden className="text-ink-faint" />}
    </>
  );
}

type GroupedListButtonProps = RowContentProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

/**
 * GroupedListItem의 버튼 행. <li> 없이 버튼만 렌더하고 ref·나머지 props를 버튼에 넘긴다.
 * `DrawerTrigger asChild` 같은 트리거의 자식으로 쓸 때 사용한다(예: /more의 "데모 모드" 행).
 */
export const GroupedListButton = forwardRef<HTMLButtonElement, GroupedListButtonProps>(
  ({ icon, label, description, tone, className, type = 'button', ...buttonProps }, ref) => (
    <button ref={ref} type={type} className={cn(ROW_CLASS, className)} {...buttonProps}>
      <RowContent icon={icon} label={label} description={description} tone={tone} chevron={false} />
    </button>
  ),
);
GroupedListButton.displayName = 'GroupedListButton';

type GroupedListItemProps = RowContentProps &
  ({ href: string; onClick?: never } | { onClick: () => void; href?: never; disabled?: boolean });

export function GroupedListItem(props: GroupedListItemProps) {
  const { icon, label, description, tone } = props;

  return (
    <li>
      {props.href !== undefined ? (
        <Link href={props.href} className={ROW_CLASS}>
          <RowContent icon={icon} label={label} description={description} tone={tone} chevron />
        </Link>
      ) : (
        <GroupedListButton icon={icon} label={label} description={description} tone={tone} onClick={props.onClick} disabled={props.disabled} />
      )}
    </li>
  );
}
