import { useCallback } from 'react';
import { z } from 'zod';

import { BOOKING_STATUSES, TOOL_NAMES } from '@repo/constants';
import { HotelSearchResultSchema } from '@repo/schemas';

import { FlightCard } from '../components/FlightCard';
import { HotelCard } from '../components/HotelCard';
import { renderToolResult } from '../components/common/renderToolResult';
import { useRenderToolResult } from './useRenderToolResult';

import type {
  Flight,
  FlightSearchResult,
  HotelAvailability,
  SelectedFlight,
  TripState,
} from '@repo/types';

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

const hotelSearchParameters = z.object({
  city: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  rooms: z.number().optional(),
  adults: z.number().optional(),
  children: z.number().optional(),
});

interface UseTravelBookingActionsOptions {
  selectFlight: (flight: Flight, type: keyof SelectedFlight) => void;
  selectHotel: (hotel: HotelAvailability) => void;
  sendMessage: (text: string) => void | Promise<void>;
  state: TripState;
}

export const useTravelBookingActions = ({
  selectFlight,
  selectHotel,
  sendMessage,
  state,
}: UseTravelBookingActionsOptions): void => {
  const handleContinueFlightBooking = useCallback(
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

  const handleContinueHotelBooking = useCallback(
    (hotel: HotelAvailability) => {
      void sendMessage(
        `I selected hotel ${hotel.id} (${hotel.name}). Continue the booking and ask only for missing guest details.`
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

            return (
              <FlightCard
                adults={args.adults}
                data={data}
                departureDate={args.departure_date}
                destination={args.destination}
                initialDeparture={confirmedDeparture}
                initialReturn={confirmedReturn}
                isBookingLocked={state.flightBooking?.status === BOOKING_STATUSES.CONFIRMED}
                isConfirmed={!!confirmedDeparture}
                onContinueBooking={handleContinueFlightBooking}
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

  useRenderToolResult(
    {
      name: TOOL_NAMES.HOTEL,
      schema: hotelSearchParameters,
      render: ({ status, result, args }) =>
        renderToolResult({
          status,
          result,
          schema: HotelSearchResultSchema,
          invalidMessage: 'Received an unexpected hotel result.',
          isEmpty: (data) => data.results.length === 0,
          emptyMessage: 'No hotels matched these dates and filters.',
          render: (data) => {
            const selectedHotel = data.results.find((hotel) => hotel.id === state.hotel?.id);

            return (
              <HotelCard
                checkIn={args.checkIn}
                checkOut={args.checkOut}
                city={args.city}
                data={data}
                initialHotel={selectedHotel ?? null}
                isBookingLocked={state.hotelBooking?.status === BOOKING_STATUSES.CONFIRMED}
                isConfirmed={!!state.hotel}
                onContinueBooking={handleContinueHotelBooking}
                onSelect={selectHotel}
              />
            );
          },
        }),
    },
    [state]
  );
};
