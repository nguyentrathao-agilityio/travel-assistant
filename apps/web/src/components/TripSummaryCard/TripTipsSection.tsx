import { Lightbulb } from 'lucide-react';

// Utils
import { cn } from '@/utils';

// Components
import { Typography } from '@/components';

// Constants
import { TIP_CATEGORY_CLASS_MAP } from '@/constants';

// Types
import type { TipsResult } from '@repo/schemas';

interface TripTipsSectionProps {
  tips?: TipsResult | null;
  className?: string;
}

/** Maximum essential tips shown in summary (keeps card compact). */
const MAX_TIPS = 4;

/**
 * Essential-only tips inside TripSummaryCard.
 * Shows a compact row per tip — not the full LocalTipsCard detail.
 */
const TripTipsSection = ({ tips, className }: TripTipsSectionProps) => {
  if (!tips?.tips?.length) return null;

  const essentialTips = tips.tips.filter((t) => t.isEssential).slice(0, MAX_TIPS);
  const displayTips = essentialTips.length ? essentialTips : tips.tips.slice(0, MAX_TIPS);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Typography
        as="span"
        variant="label"
        weight="medium"
        color="tertiary"
        className="uppercase tracking-widest"
      >
        Local tips
      </Typography>

      <ul className="flex flex-col gap-2">
        {displayTips.map((tip) => (
          <li key={tip.id} className="flex items-start gap-2">
            <Lightbulb
              size={13}
              className="text-text-secondary mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div className="flex flex-1 flex-wrap items-start justify-between gap-x-2">
              <div className="flex-1">
                <Typography as="span" variant="body" weight="medium">
                  {tip.title}
                </Typography>
                <Typography as="p" variant="meta" color="secondary" className="mt-0.5">
                  {tip.content}
                </Typography>
              </div>
              <span
                className={cn(
                  'text-badge mt-0.5 shrink-0 rounded-full px-2 py-0.5 font-medium',
                  TIP_CATEGORY_CLASS_MAP[tip.category]
                )}
              >
                {tip.category.replace('_', ' ')}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export { TripTipsSection };
