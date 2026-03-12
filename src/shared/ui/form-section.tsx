import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section className={cn('rounded-[1.5rem] border bg-card/80 p-5 shadow-sm', className)}>
      <div className="mb-4 space-y-1">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
