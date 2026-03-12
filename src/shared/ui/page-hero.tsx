import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}

export function PageHero({ eyebrow, title, description, actions, meta, className }: PageHeroProps) {
  return (
    <section className={cn('overflow-hidden rounded-[2rem] border border-primary/15 bg-[linear-gradient(155deg,rgba(200,168,88,0.12),rgba(255,255,255,0.95))] p-6 shadow-sm', className)}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          {eyebrow ? <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">{eyebrow}</p> : null}
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
          {meta ? <div className="flex flex-wrap gap-2 pt-1">{meta}</div> : null}
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
