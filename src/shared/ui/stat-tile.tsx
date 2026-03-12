import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface StatTileProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'success' | 'danger' | 'muted';
}

export function StatTile({ label, value, icon, tone = 'default' }: StatTileProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 shadow-sm',
        tone === 'success' && 'border-emerald-200 bg-emerald-50',
        tone === 'danger' && 'border-rose-200 bg-rose-50',
        tone === 'muted' && 'border-border bg-muted/40',
        tone === 'default' && 'border-primary/15 bg-background'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
        </div>
        {icon ? <div className="text-primary">{icon}</div> : null}
      </div>
    </div>
  );
}
