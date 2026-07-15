import { useRenderToolCall } from '@copilotkit/react-core';

// Schemas
import { RouteResultSchema } from '@repo/schemas';

// Components
import { RouteCard, SetLastTool, ToolLoading } from '@/components';

// Constants
import { TOOL_NAMES } from '@/constants';

// Utils
import { isToolPending } from '@/utils';

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

      const parsed = RouteResultSchema.safeParse(result);
      if (!parsed.success) return <></>;
      if (parsed.data.stops.length === 0) return <></>;

      return (
        <>
          <SetLastTool toolName={TOOL_NAMES.ROUTE} />
          <RouteCard data={parsed.data} />
        </>
      );
    },
  });
};
