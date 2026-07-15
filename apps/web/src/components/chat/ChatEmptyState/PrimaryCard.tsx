import { cn } from '@/utils';
import { Button } from '@/components';
import type { LucideIcon } from 'lucide-react';

const TRIP_IMAGE_URL = '/plan-my-trip.jpg';

interface PrimaryCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClassName?: string;
  onClick: () => void;
}

/**
 * Large 4/6-column primary card for the chat empty state hero action.
 */
const PrimaryCard = ({
  icon: Icon,
  title,
  description,
  iconClassName,
  onClick,
}: PrimaryCardProps) => (
  <Button
    variant="ghost"
    onClick={onClick}
    className="bg-background-primary flex h-full w-full items-start justify-between gap-4 rounded-lg px-5 py-4 text-left shadow"
  >
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', iconClassName)}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-card-title text-text-primary font-medium">{title}</p>
        <p className="text-body font-regular text-text-secondary mt-1 max-w-xs">{description}</p>
      </div>
    </div>
    <img
      src={TRIP_IMAGE_URL}
      alt={title}
      className="hidden h-36 w-36 shrink-0 rounded-lg object-cover md:block"
    />
  </Button>
);

export { PrimaryCard };
export type { PrimaryCardProps };
