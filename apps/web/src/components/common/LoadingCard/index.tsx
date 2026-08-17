// components/common/LoadingCard.tsx
import { cn } from '@/utils';

const SkeletonLine = ({
  width = 'w-full',
  height = 'h-3',
  className,
}: {
  width?: string;
  height?: string;
  className?: string;
}) => (
  <div
    aria-hidden="true"
    className={cn('bg-border-tertiary animate-pulse rounded', width, height, className)}
  />
);

interface LoadingCardProps {
  lines?: number;
  showFooter?: boolean;
  showBadge?: boolean;
  className?: string;
}

/**
 * Skeleton loader while AI is streaming generative card content.
 * Use in a frontend tool renderer while the tool is in progress.
 */
const LoadingCard = ({
  lines = 3,
  showFooter = true,
  showBadge = true,
  className,
}: LoadingCardProps) => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading"
    className={cn(
      'border-border-tertiary bg-background-primary w-full max-w-2xl rounded-lg border px-5 py-4',
      className
    )}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex flex-1 flex-col gap-1.5">
        <SkeletonLine width="w-1/2" height="h-3.5" />
        <SkeletonLine width="w-1/3" height="h-2.5" />
      </div>
      {showBadge && <SkeletonLine width="w-16" height="h-5" className="rounded-pill" />}
    </div>
    <div className="mt-3.5 flex flex-col gap-1.5">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? 'w-3/4' : 'w-full'} height="h-2.5" />
      ))}
    </div>
    {showFooter && (
      <div className="border-border-tertiary mt-3 flex items-center justify-between border-t pt-2.5">
        <div className="flex gap-1.5">
          <SkeletonLine width="w-16" height="h-5" className="rounded-pill" />
          <SkeletonLine width="w-12" height="h-5" className="rounded-pill" />
        </div>
        <SkeletonLine width="w-20" height="h-8" className="rounded-md" />
      </div>
    )}
    <span className="sr-only">Loading…</span>
  </div>
);

export { LoadingCard };
export type { LoadingCardProps };
