import { useRenderTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';
import { TOOL_NAMES } from '@/constants';

// Schemas
import { TripSummaryResultSchema } from '@repo/schemas';

// Hooks
import { useTripState } from './useTripState';

// Components
import {
  SetLastTool,
  ToolErrorCard,
  ToolInvalidResultCard,
  ToolLoading,
  TripSummaryCard,
} from '@/components';

// Utils
import { getToolError, isToolPending, safeParseToolResult } from '@/utils';

const tripSummaryParameters = z.object({
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  travelers: z.number().optional(),
  flightOrigin: z.string().optional(),
  skipFlights: z.boolean().optional(),
  skipHotel: z.boolean().optional(),
});

export const useTripSummaryAction = () => {
  const { state } = useTripState();

  useRenderTool(
    {
      name: TOOL_NAMES.TRIP_SUMMARY,
      parameters: tripSummaryParameters,
      render: ({ result, status, parameters: args }) => {
        if (isToolPending(status))
          return (
            <ToolLoading action="Generating" target={`trip plan summary in ${args.destination}`} />
          );

        if (getToolError(result)) return <ToolErrorCard result={result} />;

        const parsed = safeParseToolResult(TripSummaryResultSchema, result);

        if (!parsed.success)
          return <ToolInvalidResultCard message="Received an unexpected trip summary result." />;

        return (
          <>
            <SetLastTool toolName={TOOL_NAMES.TRIP_SUMMARY} />
            <TripSummaryCard
              data={parsed.data}
              bookedFlight={state.flights}
              bookedHotel={state.hotel}
            />
          </>
        );
      },
    },
    [state]
  );
};
