import { useRenderToolCall } from '@copilotkit/react-core';

// Schemas
import { PlacesSearchResultSchema } from '@repo/schemas';

// Components
import { PlacesCard, SetLastTool, ToolEmptyCard, ToolErrorCard, ToolLoading } from '@/components';

// Constants
import { TOOL_NAMES } from '@/constants';

// Utils
import { getToolError, isToolPending, safeParseToolResult } from '@/utils';

export const usePlacesAction = () => {
  useRenderToolCall({
    name: TOOL_NAMES.PLACES,
    description: 'Search places of interest in a city',
    parameters: [
      { name: 'city', type: 'string', description: 'City name', required: false },
      { name: 'category', type: 'string', description: 'Place category', required: false },
      { name: 'price_level', type: 'number', description: 'Price level 1-4', required: false },
    ],
    render: ({ status, result, args }) => {
      if (isToolPending(status)) return <ToolLoading target={`places in ${args.city}`} />;

      if (getToolError(result)) return <ToolErrorCard result={result} />;

      const parsed = safeParseToolResult(PlacesSearchResultSchema, result);

      if (!parsed.success) return <></>;
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
