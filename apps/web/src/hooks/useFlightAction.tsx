import { useCallback } from 'react';
import { useRenderTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

// Components
import { FlightCard, SetLastTool, ToolLoading } from '@/components';
import { renderToolResult } from '@/components/common/ToolResultBoundary';

// Constants
import { TOOL_NAMES } from '@/constants';

// Hooks
import { useTripState } from '@/hooks';

// Stores
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

const flightSearchResultSchema = z.custom<FlightSearchResult>(
  (value) =>
    typeof value === 'object' &&
    value !== null &&
    'results' in value &&
    Array.isArray(value.results)
);

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
        return renderToolResult({
          status,
          result,
          schema: flightSearchResultSchema,
          loading: (
            <ToolLoading
              target={`flights from ${args.origin} to ${args.destination} on ${args.departure_date}`}
            />
          ),
          invalidMessage: 'Received an unexpected flight result.',
          isEmpty: (data) => data.results.length === 0,
          emptyMessage: 'No flights matched this search.',
          render: (data) => {
            const confirmedDeparture =
              data.results.find((flight: Flight) => flight.id === state?.flights?.departure?.id) ??
              null;
            const confirmedReturn =
              data.returnResults?.find(
                (flight: Flight) => flight.id === state?.flights?.return?.id
              ) ?? null;
            const isConfirmed = !!confirmedDeparture;

            return (
              <>
                <SetLastTool toolName={TOOL_NAMES.FLIGHTS} />
                <FlightCard
                  data={data}
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
        });
      },
    },
    [state]
  );
};
