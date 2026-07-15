import { Check } from 'lucide-react';

// Utils
import { cn } from '@/utils';

// Components
import { Button } from '../Button';
import { Typography } from '../Typography';

interface ConfirmBannerProps {
  title: string;
  description: string;
  price?: string;
  onChangeClick: () => void;
  onConfirmClick: () => void;
  className?: string;
}

const ConfirmBanner = ({
  title,
  description,
  price,
  onChangeClick,
  onConfirmClick,
  className,
}: ConfirmBannerProps) => (
  <div
    className={cn(
      'bg-badge-success-bg border-badge-success-text flex items-center justify-between gap-3 rounded-lg border px-4 py-3',
      className
    )}
  >
    <div className="flex min-w-0 items-center gap-3">
      <div className="bg-badge-success-text flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
        <Check size={13} className="text-background-primary" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <Typography variant="body" weight="medium" color="primary">
          {title}
        </Typography>
        <Typography variant="meta" color="secondary" className="truncate">
          {description}
        </Typography>
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-3">
      {price && (
        <Typography variant="option-title" weight="medium" color="primary">
          {price}
        </Typography>
      )}
      <Button size="sm" variant="secondary" onClick={onChangeClick}>
        Change
      </Button>
      <Button size="sm" variant="primary" onClick={onConfirmClick}>
        Confirm
      </Button>
    </div>
  </div>
);

export { ConfirmBanner };
