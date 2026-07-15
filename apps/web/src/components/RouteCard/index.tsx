import { Clock, MapPin } from 'lucide-react';

import { cn, formatDuration, toTravelLeg } from '@/utils';
import type { LandmarkTourRoute } from '@repo/types';
import { StopCard, Typography } from '@/components';

interface RouteCardProps {
  data: LandmarkTourRoute;
  className?: string;
}

const RouteCard = ({ data, className }: RouteCardProps) => {
  return (
    <div
      className={cn(
        'border-border-tertiary w-full max-w-2xl overflow-hidden rounded-lg shadow',
        className
      )}
    >
      {/* Header */}
      <div className="bg-user-gradient px-5 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-white/70" aria-hidden="true" />
            <Typography variant="option-title" weight="medium" className="text-white">
              {data.city} landmark route
            </Typography>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={11} className="text-white/70" aria-hidden="true" />
            <Typography as="span" variant="meta" className="text-white/70">
              {formatDuration(data.totalDurationMin)}
            </Typography>
          </div>
        </div>
        {data.stops.length > 0 && (
          <Typography as="span" variant="meta" className="mt-0.5 text-white/70">
            {data.stops.length} stop{data.stops.length !== 1 ? 's' : ''}
          </Typography>
        )}
      </div>

      {/* Stop list */}
      {data?.stops?.length > 0 && (
        <div className="bg-background-primary flex flex-col gap-1 px-5 py-4">
          {data.stops.map((stop, index) => (
            <StopCard
              key={stop.name}
              stop={stop}
              index={index + 1}
              formatDuration={formatDuration}
              {...(index < data.legs.length && { nextLeg: toTravelLeg(data.legs[index]) })}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export { RouteCard };
export { RouteConfirmCard } from './RouteConfirmCard';
