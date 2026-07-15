import { CheckCircle, Plane } from 'lucide-react';

// Utils
import { cn } from '@/utils';

// Components
import { Typography, FlightOptionItem } from '@/components';

// Types
import type { SuggestedFlight } from '@repo/schemas';
import type { Flight } from '@repo/types';

interface TripFlightSectionProps {
  /** Flight from tool result (suggested) */
  suggested?: SuggestedFlight | null;
  /** Departure flight already booked in local state */
  booked?: Flight | null;
  /** Return flight already booked in local state */
  bookedReturn?: Flight | null;
  className?: string;
}

const TripFlightSection = ({
  suggested,
  booked,
  bookedReturn,
  className,
}: TripFlightSectionProps) => {
  const departureFlight = booked ?? suggested;
  const isBooked = !!booked;
  const hasReturn = !!bookedReturn;

  if (!departureFlight) return null;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Section label */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Plane size={13} className="text-icon-transport shrink-0" aria-hidden="true" />
          <Typography
            as="span"
            variant="label"
            weight="medium"
            color="tertiary"
            className="uppercase tracking-widest"
          >
            Flight
          </Typography>
        </div>
        {isBooked ? (
          <span className="bg-badge-success-bg text-badge-success-text text-badge flex items-center gap-1 rounded-full px-2 py-0.5 font-medium">
            <CheckCircle size={10} aria-hidden="true" />
            booked
          </span>
        ) : (
          <span className="bg-badge-info-bg text-badge-info-text text-badge rounded-full px-2 py-0.5 font-medium">
            suggested
          </span>
        )}
      </div>

      {/* Departure flight */}
      <div className="flex flex-col gap-1.5">
        {hasReturn && (
          <Typography
            variant="meta"
            weight="medium"
            color="secondary"
            className="uppercase tracking-widest"
          >
            Departure
          </Typography>
        )}
        <div className="border-border-secondary bg-background-secondary overflow-hidden rounded-lg border">
          <FlightOptionItem flight={departureFlight as Flight} isInfo={true} />
        </div>
      </div>

      {/* Return flight */}
      {hasReturn && (
        <div className="flex flex-col gap-1.5">
          <Typography
            variant="meta"
            weight="medium"
            color="secondary"
            className="uppercase tracking-widest"
          >
            Return
          </Typography>
          <div className="border-border-secondary bg-background-secondary overflow-hidden rounded-lg border">
            <FlightOptionItem flight={bookedReturn} isInfo={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export { TripFlightSection };
