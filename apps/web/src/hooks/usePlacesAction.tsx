import { useRenderTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

// Schemas
import { PlacesSearchResultSchema } from '@repo/schemas';

// Components
import { PlacesCard, SetLastTool, ToolLoading } from '@/components';
import { renderToolResult } from '@/components/common/ToolResultBoundary';

// Constants
import { TOOL_NAMES } from '@/constants';

const placesParameters = z.object({
  city: z.string().optional(),
  category: z.string().optional(),
  price_level: z.number().optional(),
});

export const usePlacesAction = () => {
  useRenderTool({
    name: TOOL_NAMES.PLACES,
    parameters: placesParameters,
    render: ({ status, result, parameters: args }) => {
      return renderToolResult({
        status,
        result,
        schema: PlacesSearchResultSchema,
        loading: <ToolLoading target={`places in ${args.city}`} />,
        invalidMessage: 'Received an unexpected places result.',
        isEmpty: (data) => data.total === 0,
        emptyMessage: 'No places matched this search.',
        render: (data) => (
          <>
            <SetLastTool toolName={TOOL_NAMES.PLACES} />
            <PlacesCard data={data} />
          </>
        ),
      });
    },
  });
};
