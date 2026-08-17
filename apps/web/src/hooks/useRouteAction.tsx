import { useRenderToolCall } from '@copilotkit/react-core';

// Schemas
import { RouteResultSchema } from '@repo/schemas';

// Components
import {
  RouteCard,
  SetLastTool,
  ToolEmptyCard,
  ToolErrorCard,
  ToolInvalidResultCard,
  ToolLoading,
} from '@/components';

// Constants
import { TOOL_NAMES } from '@/constants';

// Utils
import { getToolError, isToolPending, safeParseToolResult } from '@/utils';

export const useRouteAction = () => {
  useRenderToolCall({
    name: TOOL_NAMES.ROUTE,
    description: 'Show a landmark tour route for a city',
    parameters: [
      { name: 'city', type: 'string', description: 'City name', required: true },
      { name: 'maxStops', type: 'number', description: 'Max number of stops', required: false },
    ],
    render: ({ status, result, args }) => {
      if (isToolPending(status)) return <ToolLoading target={`a route in ${args.city}`} />;

      if (getToolError(result)) return <ToolErrorCard result={result} />;

      const parsed = safeParseToolResult(RouteResultSchema, result);

      if (!parsed.success)
        return <ToolInvalidResultCard message="Received an unexpected route result." />;

      if (parsed.data.stops.length === 0)
        return <ToolEmptyCard message="No route stops were available for this destination." />;

      return (
        <>
          <SetLastTool toolName={TOOL_NAMES.ROUTE} />
          <RouteCard data={parsed.data} />
        </>
      );
    },
  });
};
