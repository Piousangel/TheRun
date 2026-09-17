import type { ReactNode } from 'react';
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

type GroupedListItemProps = {
  icon: LucideIcon;
  label: string;
  description?: string;
  tone?: 'default' | 'danger';
} & ({ href: string } | { onClick: () => void; disabled?: boolean });

export function GroupedListItem(props: GroupedListItemProps) {
  const { icon: Icon, label, description, tone = 'default' } = props;
  const className = 'flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-sunken disabled:opacity-50';
  const body = (
    <>
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-sunken-strong">
        <Icon size={18} aria-hidden className={tone === 'danger' ? 'text-signal-red-fg' : 'text-ink-muted'} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-[15px] font-semibold', tone === 'danger' ? 'text-signal-red-fg' : 'text-ink')}>{label}</span>
        {description && <span className="block text-xs text-ink-dim">{description}</span>}
      </span>
      {'href' in props && <ChevronRight size={18} aria-hidden className="text-ink-faint" />}
    </>
  );

  return (
    <li>
      {'href' in props ? (
        <Link href={props.href} className={className}>{body}</Link>
      ) : (
        <button type="button" onClick={props.onClick} disabled={props.disabled} className={className}>{body}</button>
      )}
    </li>
  );
}
