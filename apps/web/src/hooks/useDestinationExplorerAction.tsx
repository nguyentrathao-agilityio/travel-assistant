import { useRenderTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

// Schemas
import { DestinationExplorerResultSchema } from '@repo/schemas';

// Components
import { DestinationExplorerCard, SetLastTool, ToolLoading } from '@/components';
import { renderToolResult } from '@/components/common/ToolResultBoundary';

// Constants
import { TOOL_NAMES } from '@/constants';

const destinationExplorerParameters = z.object({
  city: z.string().optional(),
  country: z.string().optional(),
  forecastDays: z.number().optional(),
});

export const useDestinationExplorerAction = () => {
  useRenderTool({
    name: TOOL_NAMES.DESTINATION_EXPLORER,
    parameters: destinationExplorerParameters,
    render: ({ status, result, parameters: args }) => {
      return renderToolResult({
        status,
        result,
        schema: DestinationExplorerResultSchema,
        loading: <ToolLoading action="Exploring" target={args.city || 'destination'} />,
        invalidMessage: 'Received an unexpected destination explorer result.',
        render: (data) => (
          <>
            <SetLastTool toolName={TOOL_NAMES.DESTINATION_EXPLORER} />
            <DestinationExplorerCard data={data} />
          </>
        ),
      });
    },
  });
};
