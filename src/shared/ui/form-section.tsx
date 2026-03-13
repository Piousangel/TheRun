import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.5rem] border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,244,238,0.94))] p-5 shadow-sm",
        className,
      )}
    >
      <div className="mb-4 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Section
        </p>
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
