import { useCallback } from 'react';
import { useRenderTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

// Components
import {
  FlightCard,
  SetLastTool,
  ToolEmptyCard,
  ToolErrorCard,
  ToolInvalidResultCard,
  ToolLoading,
} from '@/components';

// Utils
import { getToolError, isToolPending, parseToolResult } from '@/utils';

// Constants
import { TOOL_NAMES } from '@/constants';

// Hooks
import { useTripState } from '@/hooks';
import { useConversationRendererStore } from '@/stores';

// Types
import type { Flight, FlightSearchResult } from '@repo/types';

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

export const useFlightAction = () => {
  const { selectFlight, state } = useTripState();
  const sendMessage = useConversationRendererStore((store) => store.sendMessage);

  const handleContinueBooking = useCallback(
    (departure: Flight, returnFlight?: Flight) => {
      const returnText = returnFlight
        ? ` and return flight ${returnFlight.id} (${returnFlight.flightNumber})`
        : '';

      void sendMessage?.(
        `I selected flight ${departure.id} (${departure.flightNumber})${returnText}. Continue the booking and ask only for missing passenger details.`
      );
    },
    [sendMessage]
  );

  useRenderTool(
    {
      name: TOOL_NAMES.FLIGHTS,
      parameters: flightSearchParameters,
      render: ({ status, result, parameters: args }) => {
        if (isToolPending(status))
          return (
            <ToolLoading
              target={`flights from ${args.origin} to ${args.destination} on ${args.departure_date}`}
            />
          );

        if (getToolError(result)) return <ToolErrorCard result={result} />;

        const parsedResult = parseToolResult(result) as FlightSearchResult | undefined;

        if (parsedResult?.results && parsedResult.results.length === 0)
          return <ToolEmptyCard message="No flights matched this search." />;

        if (!parsedResult?.results)
          return <ToolInvalidResultCard message="Received an unexpected flight result." />;

        const confirmedDeparture =
          parsedResult.results.find(
            (flight: Flight) => flight.id === state?.flights?.departure?.id
          ) ?? null;
        const confirmedReturn =
          parsedResult.returnResults?.find(
            (flight: Flight) => flight.id === state?.flights?.return?.id
          ) ?? null;
        const isConfirmed = !!confirmedDeparture;

        return (
          <>
            <SetLastTool toolName={TOOL_NAMES.FLIGHTS} />
            <FlightCard
              data={parsedResult}
              {...args}
              onSelect={selectFlight}
              onContinueBooking={handleContinueBooking}
              isConfirmed={isConfirmed}
              initialDeparture={confirmedDeparture}
              initialReturn={confirmedReturn}
            />
          </>
        );
      },
    },
    [state]
  );
};
