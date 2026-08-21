import { useRenderTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

// Constants
import { TOOL_NAMES } from '@/constants';

// Schemas
import { TripSummaryResultSchema } from '@repo/schemas';

// Hooks
import { useTripState } from './useTripState';

// Components
import { SetLastTool, ToolLoading, TripSummaryCard } from '@/components';
import { renderToolResult } from '@/components/common/ToolResultBoundary';

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
        return renderToolResult({
          status,
          result,
          schema: TripSummaryResultSchema,
          loading: (
            <ToolLoading action="Generating" target={`trip plan summary in ${args.destination}`} />
          ),
          invalidMessage: 'Received an unexpected trip summary result.',
          render: (data) => (
            <>
              <SetLastTool toolName={TOOL_NAMES.TRIP_SUMMARY} />
              <TripSummaryCard data={data} bookedFlight={state.flights} bookedHotel={state.hotel} />
            </>
          ),
        });
      },
    },
    [state]
  );
};
