import { MapPin, Calendar, Users } from 'lucide-react';

// Utils
import { cn, formatDisplayDate } from '@/utils';

// Components
import { Typography } from '@/components';

interface TripSummaryHeaderProps {
  destination: string;
  startDate?: string;
  endDate?: string;
  travelers: number;
  days: number;
  className?: string;
}

/**
 * Header row for TripSummaryCard — destination, date range, traveler count, nights.
 */
const TripSummaryHeader = ({
  destination,
  startDate,
  endDate,
  travelers,
  days,
  className,
}: TripSummaryHeaderProps) => (
  <div className={cn('flex flex-col gap-2', className)}>
    <div className="flex items-center gap-2">
      <MapPin size={16} className="shrink-0 text-white/70" aria-hidden="true" />
      <Typography variant="card-title" weight="medium" className="text-white">
        {destination}
      </Typography>
      <span className="text-badge rounded-full bg-white/20 px-2 py-0.5 font-medium text-white">
        trip summary
      </span>
    </div>

    <div className="flex flex-col flex-wrap gap-3">
      {startDate && endDate && (
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-white/70" aria-hidden="true" />
          <Typography as="span" variant="meta" className="text-white/70">
            {formatDisplayDate(startDate)} – {formatDisplayDate(endDate)}
          </Typography>
        </div>
      )}

      <div className="flex items-center gap-10">
        <div className="flex items-center gap-1.5">
          <Users size={13} className="text-white/70" aria-hidden="true" />
          <Typography as="span" variant="meta" className="text-white/70">
            {travelers} traveler{travelers !== 1 ? 's' : ''}
          </Typography>
        </div>

        <div className="flex items-center gap-1">
          <Typography as="span" variant="meta" className="text-white/70">
            {days} night{days !== 1 ? 's' : ''}
          </Typography>
        </div>
      </div>
    </div>
  </div>
);

export { TripSummaryHeader };
