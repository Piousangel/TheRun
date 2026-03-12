import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface StatePanelProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "default" | "warning" | "muted";
  className?: string;
}

export function StatePanel({
  icon,
  title,
  description,
  action,
  tone = "default",
  className,
}: StatePanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border p-6 shadow-sm",
        tone === "default" &&
          "border-primary/15 bg-[linear-gradient(155deg,rgba(200,168,88,0.08),rgba(255,255,255,0.98))]",
        tone === "warning" &&
          "border-amber-200 bg-[linear-gradient(180deg,rgba(254,243,199,0.72),rgba(255,251,235,1))]",
        tone === "muted" &&
          "border-border bg-[linear-gradient(180deg,rgba(244,244,245,0.78),rgba(255,255,255,1))]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.35),transparent)]" />
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
        {icon ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-primary/15 bg-background/80 text-primary shadow-sm">
            {icon}
          </div>
        ) : null}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className="text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        </div>
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </div>
  );
}
