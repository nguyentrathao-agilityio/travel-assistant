import { useRenderTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

// Schemas
import { DestinationExplorerResultSchema } from '@repo/schemas';

// Components
import {
  DestinationExplorerCard,
  SetLastTool,
  ToolErrorCard,
  ToolInvalidResultCard,
  ToolLoading,
} from '@/components';

// Constants
import { TOOL_NAMES } from '@/constants';

// Utils
import { getToolError, isToolPending, safeParseToolResult } from '@/utils';

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
      if (isToolPending(status))
        return <ToolLoading action="Exploring" target={args.city || 'destination'} />;

      if (getToolError(result)) return <ToolErrorCard result={result} />;

      const parsed = safeParseToolResult(DestinationExplorerResultSchema, result);

      if (!parsed.success)
        return (
          <ToolInvalidResultCard message="Received an unexpected destination explorer result." />
        );

      return (
        <>
          <SetLastTool toolName={TOOL_NAMES.DESTINATION_EXPLORER} />
          <DestinationExplorerCard data={parsed.data} />
        </>
      );
    },
  });
};
