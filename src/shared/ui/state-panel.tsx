import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface StatePanelProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: 'default' | 'warning' | 'muted';
  className?: string;
}

export function StatePanel({ icon, title, description, action, tone = 'default', className }: StatePanelProps) {
  return (
    <div
      className={cn(
        'rounded-[1.75rem] border p-6 text-center shadow-sm',
        tone === 'default' && 'border-primary/15 bg-[linear-gradient(155deg,rgba(200,168,88,0.08),rgba(255,255,255,0.98))]',
        tone === 'warning' && 'border-amber-200 bg-amber-50',
        tone === 'muted' && 'border-border bg-muted/30',
        className
      )}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
        {icon ? <div className="text-primary">{icon}</div> : null}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className="text-sm leading-7 text-muted-foreground">{description}</p>
        </div>
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </div>
  );
}
