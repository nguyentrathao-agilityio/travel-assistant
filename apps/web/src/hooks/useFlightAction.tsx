import { useCallback } from 'react';
import { useCopilotChatInternal, useRenderToolCall } from '@copilotkit/react-core';

// Components
import { FlightCard, SetLastTool, ToolLoading } from '@/components';

// Utils
import { isToolPending } from '@/utils';

// Constants
import { FLIGHT_BASE_PARAMS, TOOL_NAMES } from '@/constants';

// Hooks
import { useTripState } from '@/hooks';

// Types
import type { Flight } from '@repo/types';

const FLIGHT_SEARCH_REQUIRED = ['origin', 'destination', 'departure_date'];

const searchParams = FLIGHT_BASE_PARAMS.map((p) => ({
  ...p,
  required: FLIGHT_SEARCH_REQUIRED.includes(p.name),
}));

export const useFlightAction = () => {
  const { selectFlight, state } = useTripState();
  const { sendMessage } = useCopilotChatInternal();

  const handleContinueBooking = useCallback(
    (departure: Flight, returnFlight?: Flight) => {
      const returnText = returnFlight
        ? ` and return flight ${returnFlight.id} (${returnFlight.flightNumber})`
        : '';
      void sendMessage({
        id: crypto.randomUUID(),
        role: 'user',
        content: `I selected flight ${departure.id} (${departure.flightNumber})${returnText}. Continue the booking and ask only for missing passenger details.`,
      });
    },
    [sendMessage]
  );

  useRenderToolCall({
    name: TOOL_NAMES.FLIGHTS,
    description: `Search available flights. After this tool is called, the agent will ask user to select flights from the search results.`,
    parameters: searchParams,
    render: ({ status, result, args }) => {
      if (isToolPending(status))
        return (
          <ToolLoading
            target={`flights from ${args.origin} to ${args.destination} on ${args.departure_date}`}
          />
        );
      if (!result?.results) return <></>;
      if (!result?.results?.length) return <></>;

      const confirmedDeparture =
        result?.results?.find((flight: Flight) => flight.id === state?.flights?.departure?.id) ??
        null;
      const confirmedReturn =
        result?.returnResults?.find((flight: Flight) => flight.id === state?.flights?.return?.id) ??
        null;
      const isConfirmed = !!confirmedDeparture;

      return (
        <>
          <SetLastTool toolName={TOOL_NAMES.FLIGHTS} />
          <FlightCard
            data={result}
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
};
