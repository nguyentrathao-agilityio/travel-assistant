import { useCallback } from 'react';
import { z } from 'zod';

// Types
import type { HotelAvailability, TripState } from '@repo/types';

// Constants
import { BOOKING_STATUSES, TOOL_NAMES } from '@repo/constants';

// Schemas
import { HotelSearchResultSchema } from '@repo/schemas';

// Components
import { renderToolResult } from '../components/common/renderToolResult';
import { HotelCard } from '../components/HotelCard';

// Hooks
import { useRenderToolResult } from './useRenderToolResult';

const hotelSearchParameters = z.object({
  city: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  rooms: z.number().optional(),
  adults: z.number().optional(),
  children: z.number().optional(),
});

interface UseHotelActionParams {
  state: TripState;
  selectHotel: (hotel: HotelAvailability) => void;
  sendMessage: (text: string) => void | Promise<void>;
}

export const useHotelAction = ({ state, selectHotel, sendMessage }: UseHotelActionParams) => {
  const handleContinueBooking = useCallback(
    (hotel: HotelAvailability) => {
      void sendMessage(
        `I selected hotel ${hotel.id} (${hotel.name}). Continue the booking and ask only for missing guest details.`
      );
    },
    [sendMessage]
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
            const isBookingLocked = state.hotelBooking?.status === BOOKING_STATUSES.CONFIRMED;

            return (
              <HotelCard
                checkIn={args.checkIn}
                checkOut={args.checkOut}
                city={args.city}
                data={data}
                initialHotel={selectedHotel ?? null}
                isBookingLocked={isBookingLocked}
                isConfirmed={!!state.hotel}
                onContinueBooking={handleContinueBooking}
                onSelect={selectHotel}
              />
            );
          },
        }),
    },
    [state]
  );
};
