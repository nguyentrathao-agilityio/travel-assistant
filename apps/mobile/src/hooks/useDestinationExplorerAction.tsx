import { z } from 'zod';

// Constants
import { TOOL_NAMES } from '@repo/constants';

// Schemas
import { DestinationExplorerResultSchema } from '@repo/schemas';

// Components
import { renderToolResult } from '../components/common/renderToolResult';
import { DestinationExplorerCard } from '../components/DestinationExplorerCard';

// Hooks
import { useRenderToolResult } from './useRenderToolResult';

const destinationExplorerParameters = z.object({
  city: z.string().optional(),
  country: z.string().optional(),
  forecastDays: z.number().optional(),
});

export const useDestinationExplorerAction = () => {
  useRenderToolResult({
    name: TOOL_NAMES.DESTINATION_EXPLORER,
    schema: destinationExplorerParameters,
    render: ({ status, result }) =>
      renderToolResult({
        status,
        result,
        schema: DestinationExplorerResultSchema,
        invalidMessage: 'Received an unexpected destination explorer result.',
        render: (data) => <DestinationExplorerCard data={data} />,
      }),
  });
};
