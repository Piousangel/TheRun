import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-primary/15 bg-background/90 shadow-sm">
        <div className="absolute inset-2 rounded-full bg-primary/10 blur-md" />
        <Loader2
          className={cn(
            "relative animate-spin text-primary",
            sizeClasses[size],
            className,
          )}
        />
      </div>
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({
  message = "로딩 중...",
  size = "md",
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-primary/10 bg-[linear-gradient(160deg,rgba(200,168,88,0.06),rgba(255,255,255,0.96))] px-6 py-12 text-center shadow-sm">
      <LoadingSpinner size={size} />
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">
          화면을 준비하고 있습니다
        </p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
