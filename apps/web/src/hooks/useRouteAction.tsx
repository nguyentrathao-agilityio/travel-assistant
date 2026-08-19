import { useRenderTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

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

const routeParameters = z.object({
  city: z.string().optional(),
  maxStops: z.number().optional(),
});

export const useRouteAction = () => {
  useRenderTool({
    name: TOOL_NAMES.ROUTE,
    parameters: routeParameters,
    render: ({ status, result, parameters: args }) => {
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
