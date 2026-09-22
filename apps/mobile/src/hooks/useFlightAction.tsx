import { useCallback } from 'react';
import { z } from 'zod';

// Constants
import { BOOKING_STATUSES, TOOL_NAMES } from '@repo/constants';

// Components
import { renderToolResult } from '../components/common/renderToolResult';
import { FlightCard } from '../components/FlightCard';

// Hooks
import { useRenderToolResult } from './useRenderToolResult';

// Types
import type { Flight, FlightSearchResult, SelectedFlight, TripState } from '@repo/types';

const flightSearchParameters = z.object({
  origin: z.string().optional(),
  destination: z.string().optional(),
  departure_date: z.string().optional(),
  adults: z.number().optional(),
  return_date: z.string().optional(),
  airline: z.string().optional(),
  max_price: z.number().optional(),
  max_stops: z.number().optional(),
  sort: z.string().optional(),
});

const flightSearchResultSchema = z.custom<FlightSearchResult>(
  (value) =>
    typeof value === 'object' &&
    value !== null &&
    'results' in value &&
    Array.isArray((value as { results: unknown }).results)
);

interface UseFlightActionParams {
  state: TripState;
  selectFlight: (flight: Flight, type: keyof SelectedFlight) => void;
  sendMessage: (text: string) => void | Promise<void>;
}

export const useFlightAction = ({ state, selectFlight, sendMessage }: UseFlightActionParams) => {
  const handleContinueBooking = useCallback(
    (departure: Flight, returnFlight?: Flight) => {
      const returnText = returnFlight
        ? ` and return flight ${returnFlight.id} (${returnFlight.flightNumber})`
        : '';

      void sendMessage(
        `I selected flight ${departure.id} (${departure.flightNumber})${returnText}. Continue the booking and ask only for missing passenger details.`
      );
    },
    [sendMessage]
  );

  useRenderToolResult(
    {
      name: TOOL_NAMES.FLIGHTS,
      schema: flightSearchParameters,
      render: ({ status, result, args }) =>
        renderToolResult({
          status,
          result,
          schema: flightSearchResultSchema,
          invalidMessage: 'Received an unexpected flight result.',
          isEmpty: (data) => data.results.length === 0,
          emptyMessage: 'No flights matched this search.',
          render: (data) => {
            const confirmedDeparture =
              data.results.find((flight) => flight.id === state.flights?.departure?.id) ?? null;
            const confirmedReturn =
              data.returnResults?.find((flight) => flight.id === state.flights?.return?.id) ?? null;
            const isConfirmed = !!confirmedDeparture;
            const isBookingLocked = state.flightBooking?.status === BOOKING_STATUSES.CONFIRMED;

            return (
              <FlightCard
                adults={args.adults}
                data={data}
                departureDate={args.departure_date}
                destination={args.destination}
                initialDeparture={confirmedDeparture}
                initialReturn={confirmedReturn}
                isBookingLocked={isBookingLocked}
                isConfirmed={isConfirmed}
                onContinueBooking={handleContinueBooking}
                onSelect={selectFlight}
                origin={args.origin}
                returnDate={args.return_date}
              />
            );
          },
        }),
    },
    [state]
  );
};
