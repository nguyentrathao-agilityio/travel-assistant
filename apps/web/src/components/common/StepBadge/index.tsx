import { cn } from '@/utils';

interface StepBadgeProps {
  index: number;
  className?: string;
}

const StepBadge = ({ index, className }: StepBadgeProps) => (
  <span
    aria-label={`Step ${index}`}
    className={cn(
      'bg-badge-primary-bg text-badge-primary-text text-label flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-medium',
      className
    )}
  >
    {index}
  </span>
);

export { StepBadge };
