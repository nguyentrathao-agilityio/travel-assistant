import { Building2, Compass, DollarSign, LucideIcon, Plane, Tag, Utensils } from 'lucide-react';

// Utils
import { cn, formatAmount } from '@/utils';

// Components
import { Divider, Typography } from '@/components';
import { TripCostEstimate } from '@repo/schemas';

const COST_ICON_MAP: { keywords: string[]; icon: LucideIcon; colorClass: string }[] = [
  { keywords: ['flight', 'air'], icon: Plane, colorClass: 'text-icon-transport' },
  {
    keywords: ['hotel', 'accommodation', 'stay', 'room'],
    icon: Building2,
    colorClass: 'text-icon-morning',
  },
  {
    keywords: ['food', 'meal', 'dining', 'restaurant'],
    icon: Utensils,
    colorClass: 'text-icon-afternoon',
  },
  {
    keywords: ['activity', 'activities', 'tour', 'sightseeing'],
    icon: Compass,
    colorClass: 'text-icon-link',
  },
];

interface TripCostBreakdownProps {
  estimate: TripCostEstimate;
  className?: string;
}

const TripCostBreakdown = ({ estimate, className }: TripCostBreakdownProps) => {
  const getCostItem = (label: string): { Icon: LucideIcon; colorClass: string } => {
    const l = label.toLowerCase();
    const match = COST_ICON_MAP.find(({ keywords }) => keywords.some((k) => l.includes(k)));

    return match
      ? { Icon: match.icon, colorClass: match.colorClass }
      : { Icon: Tag, colorClass: 'text-icon-ticket' };
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        <DollarSign size={14} className="text-icon-money shrink-0" aria-hidden="true" />
        <Typography
          as="span"
          variant="label"
          weight="medium"
          color="tertiary"
          className="uppercase tracking-widest"
        >
          Estimated total
        </Typography>
      </div>

      <div className="border-border-secondary bg-background-primary rounded-lg border">
        {/* Breakdown rows */}
        <ul className="divide-border-secondary divide-y">
          {estimate.breakdown.map((item) => {
            const { Icon, colorClass } = getCostItem(item.label);

            return (
              <li key={item.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Icon size={13} className={cn(colorClass, 'shrink-0')} aria-hidden="true" />
                  <div className="flex flex-col">
                    <Typography as="span" variant="body" color="primary">
                      {item.label}
                    </Typography>
                    {item.note && (
                      <Typography as="span" variant="meta" color="tertiary">
                        {item.note}
                      </Typography>
                    )}
                  </div>
                </div>
                <Typography as="span" variant="body" weight="medium" className="shrink-0">
                  {item.amount === 0 ? '—' : `~${formatAmount(item.amount, item.currency)}`}
                </Typography>
              </li>
            );
          })}
        </ul>

        <Divider />

        {/* Grand total */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-col">
            <Typography as="span" variant="option-title" weight="medium">
              Grand total
            </Typography>
            <Typography as="span" variant="meta" color="tertiary">
              {estimate.days} night{estimate.days !== 1 ? 's' : ''} · {estimate.travelers} traveler
              {estimate.travelers !== 1 ? 's' : ''}
            </Typography>
          </div>
          <Typography as="span" variant="card-title" weight="medium" className="shrink-0">
            ~{formatAmount(estimate.grandTotal, estimate.currency)}
          </Typography>
        </div>
      </div>
    </div>
  );
};

export { TripCostBreakdown };
