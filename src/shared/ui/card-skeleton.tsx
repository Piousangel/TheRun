/* eslint-disable no-restricted-syntax -- 공용 Skeleton 정의 자체이므로 animate-pulse 사용이 허용된다 */
import { cn } from '@/shared/lib/utils';

/** ListCard와 같은 외곽 크기의 로딩 자리표시자. 로딩 UI는 이것만 쓴다. */
export function CardSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div role="status" aria-label="불러오는 중" className={cn('flex flex-col gap-3', className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex min-h-[92px] flex-col gap-2 rounded-[14px] border border-border bg-background p-4" data-testid="card-skeleton">
          <div className="h-4 w-1/4 rounded bg-sunken-strong motion-safe:animate-pulse" />
          <div className="h-5 w-3/4 rounded bg-sunken-strong motion-safe:animate-pulse" />
          <div className="h-3.5 w-1/2 rounded bg-sunken-strong motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  );
}
