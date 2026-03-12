import type { ReactNode } from 'react';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(245,245,244,1),rgba(255,255,255,1))] p-4 sm:p-8">
      <div className="mx-auto max-w-md space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-primary/15 bg-[linear-gradient(155deg,rgba(200,168,88,0.12),rgba(255,255,255,0.96))] p-6 text-center shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
        </section>

        {children}

        {footer ? <div>{footer}</div> : null}
      </div>
    </main>
  );
}
