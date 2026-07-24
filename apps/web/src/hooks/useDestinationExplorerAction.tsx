import { useRenderToolCall } from '@copilotkit/react-core';

// Schemas
import { DestinationExplorerResultSchema } from '@repo/schemas';

// Components
import { DestinationExplorerCard, SetLastTool, ToolLoading } from '@/components';

// Constants
import { TOOL_NAMES } from '@/constants';

// Utils
import { isToolPending, safeParseToolResult } from '@/utils';

export const useDestinationExplorerAction = () => {
  useRenderToolCall({
    name: TOOL_NAMES.DESTINATION_EXPLORER,
    description: 'Render the unified destination explorer card with places, tips, and weather',
    parameters: [
      { name: 'city', type: 'string', description: 'Destination city', required: true },
      { name: 'country', type: 'string', description: 'Country name', required: false },
      {
        name: 'forecastDays',
        type: 'number',
        description: 'Number of forecast days (1-16)',
        required: false,
      },
    ],
    render: ({ status, result, args }) => {
      if (isToolPending(status))
        return <ToolLoading action="Exploring" target={args.city || 'destination'} />;

      const parsed = safeParseToolResult(DestinationExplorerResultSchema, result);
      if (!parsed.success) return <></>;

      return (
        <>
          <SetLastTool toolName={TOOL_NAMES.DESTINATION_EXPLORER} />
          <DestinationExplorerCard data={parsed.data} />
        </>
      );
    },
  });
};
