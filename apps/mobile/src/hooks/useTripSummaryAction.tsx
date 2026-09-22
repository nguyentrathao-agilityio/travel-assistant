import { z } from 'zod';

// Constants
import { TOOL_NAMES } from '@repo/constants';

// Schemas
import { TripSummaryResultSchema } from '@repo/schemas';

// Components
import { renderToolResult } from '../components/common/renderToolResult';
import { TripSummaryCard } from '../components/TripSummaryCard';

// Hooks
import { useRenderToolResult } from './useRenderToolResult';

// Types
import type { TripState } from '@repo/types';

const tripSummaryParameters = z.object({
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  travelers: z.number().optional(),
  flightOrigin: z.string().optional(),
  skipFlights: z.boolean().optional(),
  skipHotel: z.boolean().optional(),
});

interface UseTripSummaryActionParams {
  state: TripState;
}

export const useTripSummaryAction = ({ state }: UseTripSummaryActionParams) => {
  useRenderToolResult(
    {
      name: TOOL_NAMES.TRIP_SUMMARY,
      schema: tripSummaryParameters,
      render: ({ status, result }) =>
        renderToolResult({
          status,
          result,
          schema: TripSummaryResultSchema,
          invalidMessage: 'Received an unexpected trip summary result.',
          render: (data) => (
            <TripSummaryCard bookedFlight={state.flights} bookedHotel={state.hotel} data={data} />
          ),
        }),
    },
    [state]
  );
};
