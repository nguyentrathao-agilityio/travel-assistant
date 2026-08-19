import { useRenderTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

// Schemas
import { TipsResultSchema } from '@repo/schemas';

// Components
import {
  LocalTipsCard,
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

const localTipsParameters = z.object({
  city: z.string().optional(),
  country: z.string().optional(),
  category: z.string().optional(),
  essential_only: z.boolean().optional(),
});

export const useLocalTipsAction = () => {
  useRenderTool({
    name: TOOL_NAMES.LOCAL_TIPS,
    parameters: localTipsParameters,
    render: ({ result, status, parameters: args }) => {
      if (isToolPending(status))
        return <ToolLoading target={`local tips in ${args.city || args.country}`} />;

      if (getToolError(result)) return <ToolErrorCard result={result} />;

      const parsed = safeParseToolResult(TipsResultSchema, result);

      if (!parsed.success)
        return <ToolInvalidResultCard message="Received an unexpected local tips result." />;

      if (parsed.data.count === 0)
        return <ToolEmptyCard message="No local tips were available for this destination." />;

      return (
        <>
          <SetLastTool toolName={TOOL_NAMES.LOCAL_TIPS} />
          <LocalTipsCard data={parsed.data} />
        </>
      );
    },
  });
};
