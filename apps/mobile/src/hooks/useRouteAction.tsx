import { TOOL_NAMES } from '@repo/constants';
import { RouteResultSchema } from '@repo/schemas';
import { z } from 'zod';

import { renderToolResult } from '../components/common/renderToolResult';
import { RouteCard } from '../components/RouteCard';
import { useRenderToolResult } from './useRenderToolResult';

const routeParameters = z.object({
  city: z.string().optional(),
  maxStops: z.number().optional(),
});

export const useRouteAction = () => {
  useRenderToolResult({
    name: TOOL_NAMES.ROUTE,
    schema: routeParameters,
    render: ({ status, result }) =>
      renderToolResult({
        status,
        result,
        schema: RouteResultSchema,
        invalidMessage: 'Received an unexpected route result.',
        isEmpty: (data) => data.stops.length === 0,
        emptyMessage: 'No route stops were available for this destination.',
        render: (data) => <RouteCard data={data} />,
      }),
  });
};
