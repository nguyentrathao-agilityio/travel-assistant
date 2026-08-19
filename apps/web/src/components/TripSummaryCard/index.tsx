// Components
import { Divider } from '@/components';

// Sub-components
import { TripSummaryHeader } from './TripSummaryHeader';
import { TripFlightSection } from './TripFlightSection';
import { TripHotelSection } from './TripHotelSection';
import { TripRouteSection } from './TripRouteSection';
import { TripCostBreakdown } from './TripCostBreakdown';

// Types
import type { SelectedFlight, Hotel } from '@repo/types';
import { TripSummaryResult } from '@repo/schemas';

// Utils
import { cn, replaceCostEstimateWithBookings } from '@/utils';
import { useMemo } from 'react';

interface TripSummaryCardProps {
  /** Full summary from the trip-summary-tool */
  data: TripSummaryResult;
  /** Booked flights from local TripState (takes priority over suggested) */
  bookedFlight?: SelectedFlight;
  /** Booked hotel from local TripState (takes priority over suggested) */
  bookedHotel?: Hotel;
  className?: string;
}

/**
 * Unified A-to-Z trip summary card.
 * Combines local booking state with fresh tool data into a single view.
 * Renders: trip header · flight · hotel · top places · route · local tips · cost estimate.
 */
const TripSummaryCard = ({ data, bookedFlight, bookedHotel, className }: TripSummaryCardProps) => {
  if (!data) return null;

  const hasFlight = !!(bookedFlight?.departure ?? data.suggestedFlight);
  const hasHotel = !!(bookedHotel ?? data.suggestedHotel);
  const hasRoute = !!data.route?.stops?.length;

  // If a flight or hotel is booked, we need to create a new cost estimate that reflects the booked price.
  const finalCostEstimate = useMemo(() => {
    return replaceCostEstimateWithBookings({
      costEstimate: data.costEstimate,
      days: data.days,
      travelers: data.travelers,
      bookedFlight,
      bookedHotel,
    });
  }, [data.costEstimate, data.days, bookedFlight, bookedHotel]);

  return (
    <div
      className={cn(
        'card-typography border-border-tertiary w-full max-w-2xl overflow-hidden rounded-lg shadow',
        className
      )}
    >
      {/* Header */}
      <div className="bg-user-gradient px-5 py-4">
        <TripSummaryHeader
          destination={data.destination}
          startDate={data.startDate}
          endDate={data.endDate}
          travelers={data.travelers}
          days={data.days}
        />
      </div>

      {/* Body */}
      <div className="bg-background-primary flex flex-col gap-3 px-5 py-4">
        {/* Flight */}
        {hasFlight && (
          <TripFlightSection
            suggested={data.suggestedFlight}
            booked={bookedFlight?.departure ?? null}
            bookedReturn={bookedFlight?.return ?? null}
          />
        )}

        {/* Hotel */}
        {hasHotel && (
          <>
            {hasFlight && <Divider />}
            <TripHotelSection
              suggested={data.suggestedHotel}
              booked={bookedHotel ?? null}
              nights={data.days}
            />
          </>
        )}

        {/* Day-by-day route plan */}
        {hasRoute && (
          <>
            {(hasFlight || hasHotel) && <Divider />}
            <TripRouteSection route={data.route} days={data.days} startDate={data.startDate} />
          </>
        )}

        {/* Cost estimate */}
        {(hasFlight || hasHotel || hasRoute) && <Divider />}
        <TripCostBreakdown estimate={finalCostEstimate} />
      </div>
    </div>
  );
};

export { TripSummaryCard };
