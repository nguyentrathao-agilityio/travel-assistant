import { ArrowRight, Clock, Hourglass, Plane, Radio } from 'lucide-react';

// Utils
import { cn, formatDuration, formatPrice, formatTime, getAirlineIconClass } from '@/utils';

// Components
import { Badge, Button, Typography } from '@/components';
import type { BadgeVariant } from '@/components';

// Constants
import { FLIGHT_LOW_SEATS_THRESHOLD } from '@/constants';

// Types
import type { Flight } from '@repo/types';

interface FlightOptionItemProps {
  flight: Flight;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  badge?: string;
  badgeVariant?: BadgeVariant;
  isInfo?: boolean;
}

const FlightOptionItem = ({
  flight,
  isSelected = false,
  onSelect,
  badge,
  badgeVariant = 'success',
  isInfo = false,
}: FlightOptionItemProps) => {
  const handleSelect = () => onSelect?.(flight.id);
  const stopsLabel =
    flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-6 px-4 py-3 transition-colors',
        isSelected || isInfo ? 'bg-background-info' : 'hover:bg-background-secondary'
      )}
    >
      {/* Left: airline icon + flight info */}
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md',
            getAirlineIconClass(flight.airline.code)
          )}
        >
          <span className="text-label font-medium">
            {flight.airline.code.slice(0, 2).toUpperCase()}
          </span>
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <Typography variant="option-title" weight="medium">
            {flight.airline.name} &middot; {flight.flightNumber}
          </Typography>

          <div className="text-text-secondary text-meta font-regular flex flex-col flex-wrap items-start gap-x-3 gap-y-0.5">
            <span className="flex items-center gap-1">
              <Clock size={11} aria-hidden="true" className="text-icon-time shrink-0" />
              {formatTime(flight.departureTime)}
              <ArrowRight size={10} aria-hidden="true" className="text-text-tertiary shrink-0" />
              {formatTime(flight.arrivalTime)}
            </span>
            <span className="flex items-center gap-1">
              <Hourglass size={11} aria-hidden="true" className="text-icon-time shrink-0" />
              {formatDuration(flight.durationMinutes)}
            </span>
            <span className="flex items-center gap-1">
              <Radio size={11} aria-hidden="true" className="text-icon-transport shrink-0" />
              {stopsLabel}
            </span>
          </div>

          {flight.seatsAvailable <= FLIGHT_LOW_SEATS_THRESHOLD && (
            <Typography variant="meta" color="tertiary" className="flex items-center gap-1">
              <Plane size={11} aria-hidden="true" className="text-icon-afternoon shrink-0" />
              {flight.seatsAvailable} seats left
            </Typography>
          )}
        </div>
      </div>

      {/* Right: badge + price + Select */}
      <div className="flex shrink-0 items-center gap-3">
        {badge && <Badge variant={badgeVariant} label={badge} showIcon={false} />}
        <Typography variant="option-title" weight="medium" color="primary">
          {formatPrice(flight.price, flight.currency)}
        </Typography>
        {onSelect &&
          (isSelected ? (
            <Typography variant="meta" weight="medium" color="tertiary">
              Selected
            </Typography>
          ) : (
            <Button size="sm" variant="primary" onClick={handleSelect}>
              Select
            </Button>
          ))}
      </div>
    </div>
  );
};

export { FlightOptionItem };
