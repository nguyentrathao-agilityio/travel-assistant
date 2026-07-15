import { Clock, ExternalLink, Ticket } from 'lucide-react';

// Utils
import { cn, toMapsUrl } from '@/utils';

// Components
import { Card, LegConnector, StepBadge, Typography } from '@/components';
import { LocalTipsDrawer, TipsState } from './LocalTipsDrawer';

// Types
import type { LandmarkStop, TravelLeg } from '@repo/types';

export interface StopCardProps {
  stop: LandmarkStop;
  index: number;
  nextLeg?: TravelLeg;
  tipsState?: TipsState;
  className?: string;
  formatDuration: (min: number) => string;
}

const StopCard = ({
  stop,
  index,
  nextLeg,
  formatDuration,
  tipsState,
  className,
}: StopCardProps) => {
  const { name, description, visitDurationMin, openingHours, entranceFee, lat, lng } = stop;
  const mapsUrl = toMapsUrl(lat, lng);

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex gap-2.5">
        <StepBadge index={index} className="text-label mt-0.5 h-6 w-6" />

        <Card paddingClass="px-3 py-2.5" className="flex-1">
          {/* Title + visit duration */}
          <div className="flex items-start justify-between gap-2">
            <Typography variant="body" weight="medium">
              {name}
            </Typography>
            {visitDurationMin && (
              <span className="bg-border-tertiary/50 text-text-tertiary text-badge shrink-0 rounded-full px-2 py-0.5 font-medium">
                ~{formatDuration(visitDurationMin)}
              </span>
            )}
          </div>

          {/* Description */}
          {description && (
            <Typography variant="meta" color="secondary" className="mt-0.5 leading-relaxed">
              {description}
            </Typography>
          )}

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-[40px]">
            {openingHours && (
              <span className="text-text-secondary text-meta font-regular flex items-center gap-1">
                <Clock size={12} aria-hidden="true" className="text-icon-time shrink-0" />
                {openingHours}
              </span>
            )}
            {entranceFee && (
              <span className="text-text-secondary text-meta font-regular flex items-center gap-1">
                <Ticket size={12} aria-hidden="true" className="text-icon-ticket shrink-0" />
                {entranceFee === 0 ? 'Free entry' : `${entranceFee.toLocaleString()}`}
              </span>
            )}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary text-meta font-regular flex items-center gap-1 underline underline-offset-2"
              >
                <ExternalLink size={12} aria-hidden="true" className="text-icon-link shrink-0" />
                Map
              </a>
            )}
          </div>

          {/* Local tips drawer */}
          {tipsState && <LocalTipsDrawer stopName={name} {...tipsState} />}
        </Card>
      </div>

      {/* Leg connector to next stop */}
      {nextLeg && <LegConnector leg={nextLeg} formatDuration={formatDuration} className="mt-0.5" />}
    </div>
  );
};

export { StopCard };
export { LocalTipsDrawer } from './LocalTipsDrawer';
