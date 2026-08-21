import { useCallback } from 'react';
import { useRenderTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

// Constants
import { TOOL_NAMES } from '@/constants';

// Components
import { HotelCard, SetLastTool, ToolLoading } from '@/components';
import { renderToolResult } from '@/components/common/ToolResultBoundary';

// Hooks
import { useTripState } from '@/hooks';

// Stores
import { useConversationRendererStore } from '@/stores';

// Schemas
import { HotelAvailability, HotelSearchResultSchema } from '@repo/schemas';

const hotelSearchParameters = z.object({
  city: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  rooms: z.number().optional(),
  adults: z.number().optional(),
  children: z.number().optional(),
});

export const useHotelAction = () => {
  const { selectHotel, state } = useTripState();
  const sendMessage = useConversationRendererStore((store) => store.sendMessage);

  const handleContinueBooking = useCallback(
    (hotel: { id: string; name: string }) => {
      void sendMessage?.(
        `I selected hotel ${hotel.id} (${hotel.name}). Continue the booking and ask only for missing guest details.`
      );
    },
    [sendMessage]
  );

  useRenderTool(
    {
      name: TOOL_NAMES.HOTEL,
      parameters: hotelSearchParameters,
      render: ({ status, result, parameters: args }) => {
        return renderToolResult({
          status,
          result,
          schema: HotelSearchResultSchema,
          loading: (
            <ToolLoading
              target={`hotels in ${args.city} from ${args.checkIn} to ${args.checkOut}`}
            />
          ),
          invalidMessage: 'Received an unexpected hotel result.',
          isEmpty: (data) => data.results.length === 0,
          emptyMessage: 'No hotels matched these dates and filters.',
          render: (data) => {
            const selectedHotel =
              data.results.find((hotel: HotelAvailability) => hotel.id === state.hotel?.id) ?? null;

            return (
              <>
                <SetLastTool toolName={TOOL_NAMES.HOTEL} />
                <HotelCard
                  data={data}
                  city={args.city}
                  checkIn={args.checkIn}
                  checkOut={args.checkOut}
                  onSelect={selectHotel}
                  onContinueBooking={handleContinueBooking}
                  isConfirmed={!!state.hotel}
                  initialHotel={selectedHotel}
                />
              </>
            );
          },
        });
      },
    },
    [state]
  );
};
