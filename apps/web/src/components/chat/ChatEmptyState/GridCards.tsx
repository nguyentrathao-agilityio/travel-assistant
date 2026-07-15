import { ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/utils';
import { Button } from '@/components/common';

interface SmallCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClassName?: string;
  onClick: () => void;
}

/**
 * 2/6-column card with top-right arrow for the chat empty state.
 */
const SmallCard = ({ icon: Icon, title, description, iconClassName, onClick }: SmallCardProps) => (
  <Button
    variant="ghost"
    onClick={onClick}
    className="bg-background-primary flex h-full w-full flex-col items-start justify-between rounded-lg px-5 py-4 text-left shadow"
  >
    <div className="flex w-full items-start justify-between">
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', iconClassName)}>
        <Icon size={18} />
      </div>
      <ArrowUpRight size={16} className="text-text-tertiary" />
    </div>
    <div className="mt-4">
      <p className="text-card-title text-text-primary font-medium">{title}</p>
      <p className="text-body font-regular text-text-secondary mt-1">{description}</p>
    </div>
  </Button>
);

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClassName?: string;
  onClick: () => void;
}

/**
 * 3/6-column horizontal card for secondary actions in the chat empty state.
 */
const FeatureCard = ({
  icon: Icon,
  title,
  description,
  iconClassName,
  onClick,
}: FeatureCardProps) => (
  <Button
    variant="ghost"
    onClick={onClick}
    className="bg-background-primary flex w-full items-center justify-start gap-4 rounded-lg px-5 py-4 text-left shadow"
  >
    <div
      className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
        iconClassName
      )}
    >
      <Icon size={20} />
    </div>
    <div>
      <p className="text-card-title text-text-primary font-medium">{title}</p>
      <p className="text-body font-regular text-text-secondary mt-0.5">{description}</p>
    </div>
  </Button>
);

export { SmallCard, FeatureCard };
export type { SmallCardProps, FeatureCardProps };
