import { Lightbulb } from 'lucide-react';

// Utils
import { cn } from '@/utils';

// Components
import { Typography } from '@/components';

// Constants
import { TIP_CATEGORY_CLASS_MAP, TIP_CATEGORY_LABELS } from '@/constants';

// Types
import type { TipsResult } from '@repo/types';

interface LocalTipsCardProps {
  data?: TipsResult;
  isLoading?: boolean;
  className?: string;
}

/**
 * Generative UI card — local tips and practical travel advice.
 */
const LocalTipsCard = ({ data, className }: LocalTipsCardProps) => {
  return (
    <div
      className={cn(
        'card-typography border-border-tertiary w-full max-w-2xl overflow-hidden rounded-lg shadow',
        className
      )}
    >
      {/* Header */}
      <div className="bg-user-gradient px-5 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-white/70" aria-hidden="true" />
            <Typography variant="card-title" weight="medium" className="text-white">
              Local tips{data?.city ? `: ${data?.city}` : ''}
            </Typography>
          </div>
          <Typography as="span" variant="meta" className="text-white/70">
            {data?.count} tip{data?.count !== 1 ? 's' : ''}
          </Typography>
        </div>
        {data?.summary && (
          <Typography variant="meta" className="mt-0.5 text-white/70">
            {data?.summary}
          </Typography>
        )}
      </div>

      {/* Tips list */}
      {data?.tips?.length ? (
        <ul className="bg-background-primary divide-border-tertiary flex flex-col divide-y">
          {data.tips.map((tip) => (
            <li key={tip.id} className="px-5 py-3">
              <div className="flex items-start justify-between gap-2">
                <Typography variant="body" weight="medium" color="primary">
                  {tip.title}
                </Typography>
                <div className="flex shrink-0 items-center gap-1.5">
                  {tip.isEssential && (
                    <span className="bg-badge-warning-bg text-badge-warning-text text-badge rounded-full px-2 py-0.5 font-medium">
                      ⭐ Essential
                    </span>
                  )}
                  <span
                    className={cn(
                      'text-badge rounded-full px-2 py-0.5 font-medium',
                      TIP_CATEGORY_CLASS_MAP[tip.category]
                    )}
                  >
                    {TIP_CATEGORY_LABELS[tip.category]}
                  </span>
                </div>
              </div>
              <Typography variant="meta" color="secondary" className="mt-0.5 leading-relaxed">
                {tip.content}
              </Typography>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export { LocalTipsCard };
