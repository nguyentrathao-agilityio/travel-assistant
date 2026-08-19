import { useRenderTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

// Schemas
import { RouteResultSchema } from '@repo/schemas';

// Components
import { RouteCard, SetLastTool, ToolLoading } from '@/components';
import { renderToolResult } from '@/components/common/ToolResultBoundary';

// Constants
import { TOOL_NAMES } from '@/constants';

const routeParameters = z.object({
  city: z.string().optional(),
  maxStops: z.number().optional(),
});

export const useRouteAction = () => {
  useRenderTool({
    name: TOOL_NAMES.ROUTE,
    parameters: routeParameters,
    render: ({ status, result, parameters: args }) => {
      return renderToolResult({
        status,
        result,
        schema: RouteResultSchema,
        loading: <ToolLoading target={`a route in ${args.city}`} />,
        invalidMessage: 'Received an unexpected route result.',
        isEmpty: (data) => data.stops.length === 0,
        emptyMessage: 'No route stops were available for this destination.',
        render: (data) => (
          <>
            <SetLastTool toolName={TOOL_NAMES.ROUTE} />
            <RouteCard data={data} />
          </>
        ),
      });
    },
  });
};
