import { useCallback } from 'react';
import { useRenderToolCall } from '@copilotkit/react-core';

// Constants
import { TOOL_NAMES, TOOL_STATUS } from '@/constants';

// Components
import {
  HotelCard,
  SetLastTool,
  ToolEmptyCard,
  ToolErrorCard,
  ToolInvalidResultCard,
  ToolLoading,
} from '@/components';

// Utils
import { getToolError, isToolPending, safeParseToolResult } from '@/utils';

// Hooks
import { useTripState } from '@/hooks';
import { useConversationRendererStore } from '@/stores';

// Schemas
import { HotelAvailability, HotelSearchResultSchema } from '@repo/schemas';

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

  useRenderToolCall({
    name: TOOL_NAMES.HOTEL,
    description:
      'Show available hotels for a city and dates based on user request. After this tool is called, the agent will ask user to select a hotel from the search results.',
    parameters: [
      {
        name: 'city',
        type: 'string',
        description: 'City name to search, e.g. "Da Nang" or "Bangkok"',
        required: true,
      },
      {
        name: 'checkIn',
        type: 'string',
        description: 'Check-in date in YYYY-MM-DD format',
        required: true,
      },
      {
        name: 'checkOut',
        type: 'string',
        description: 'Check-out date in YYYY-MM-DD format',
        required: true,
      },
      { name: 'rooms', type: 'number', description: 'Number of rooms needed', required: false },
      { name: 'adults', type: 'number', description: 'Number of adults', required: false },
      { name: 'children', type: 'number', description: 'Number of children', required: false },
    ],
    render: ({ status, result, args }) => {
      if (isToolPending(status))
        return (
          <ToolLoading target={`hotels in ${args.city} from ${args.checkIn} to ${args.checkOut}`} />
        );

      if (getToolError(result)) return <ToolErrorCard result={result} />;

      if (status === TOOL_STATUS.COMPLETE && result) {
        const parsed = safeParseToolResult(HotelSearchResultSchema, result);
        if (!parsed.success)
          return <ToolInvalidResultCard message="Received an unexpected hotel result." />;

        if (parsed.data.results.length === 0)
          return <ToolEmptyCard message="No hotels matched these dates and filters." />;

        const selectedHotel =
          parsed.data.results.find((hotel: HotelAvailability) => hotel.id === state.hotel?.id) ??
          null;

        return (
          <>
            <SetLastTool toolName={TOOL_NAMES.HOTEL} />
            <HotelCard
              data={parsed.data}
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
      }

      return <></>;
    },
  });
};
