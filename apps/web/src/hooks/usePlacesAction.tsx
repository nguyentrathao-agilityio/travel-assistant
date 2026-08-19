import { useRenderTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

// Schemas
import { PlacesSearchResultSchema } from '@repo/schemas';

// Components
import {
  PlacesCard,
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
      if (isToolPending(status)) return <ToolLoading target={`places in ${args.city}`} />;

      if (getToolError(result)) return <ToolErrorCard result={result} />;

      const parsed = safeParseToolResult(PlacesSearchResultSchema, result);

      if (!parsed.success)
        return <ToolInvalidResultCard message="Received an unexpected places result." />;

      if (parsed.data.total === 0)
        return <ToolEmptyCard message="No places matched this search." />;

      return (
        <>
          <SetLastTool toolName={TOOL_NAMES.PLACES} />
          <PlacesCard data={parsed.data} />
        </>
      );
    },
  });
};
