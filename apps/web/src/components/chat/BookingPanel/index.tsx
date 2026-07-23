import { ArrowRight, Building2, Plane } from 'lucide-react';

// Components
import { Typography } from '@/components';

// Hooks
import { useTripState } from '@/hooks';

// Utils
import { formatTime } from '@/utils';

const BookingPanel = () => {
  const { state } = useTripState();

  const departure = state?.flights?.departure;
  const returnFlight = state?.flights?.return;
  const hotel = state?.hotel;

  if (!departure && !hotel) return null;

  return (
    <div
      role="region"
      aria-label="Current bookings"
      className="border-border-secondary bg-background-secondary flex flex-col gap-1 border-b px-5 py-2"
    >
      {departure && (
        <div className="flex min-w-0 items-center gap-2">
          <Plane size={13} className="text-text-tertiary shrink-0" aria-hidden="true" />
          <Typography variant="meta" color="secondary" className="min-w-0 truncate">
            {departure.origin}
            <ArrowRight size={10} className="mx-1 inline-block" aria-hidden="true" />
            {departure.destination} · {departure.airline.name} {departure.flightNumber} ·{' '}
            {formatTime(departure.departureTime)}
          </Typography>
        </div>
      )}

      {returnFlight && (
        <div className="flex min-w-0 items-center gap-2">
          <Plane
            size={13}
            className="text-text-tertiary shrink-0 -scale-x-100"
            aria-hidden="true"
          />
          <Typography variant="meta" color="secondary" className="min-w-0 truncate">
            {returnFlight.origin}
            <ArrowRight size={10} className="mx-1 inline-block" aria-hidden="true" />
            {returnFlight.destination} · {returnFlight.airline.name} {returnFlight.flightNumber} ·{' '}
            {formatTime(returnFlight.departureTime)}
          </Typography>
        </div>
      )}

      {hotel && (
        <div className="flex min-w-0 items-center gap-2">
          <Building2 size={13} className="text-text-tertiary shrink-0" aria-hidden="true" />
          <Typography variant="meta" color="secondary" className="min-w-0 truncate">
            {hotel.name} · {hotel.city} · {hotel.nights} night{hotel.nights !== 1 ? 's' : ''}
          </Typography>
        </div>
      )}
    </div>
  );
};

export { BookingPanel };
