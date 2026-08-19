import { useRenderTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

// Schemas
import { TipsResultSchema } from '@repo/schemas';

// Components
import { LocalTipsCard, SetLastTool, ToolLoading } from '@/components';
import { renderToolResult } from '@/components/common/ToolResultBoundary';

// Constants
import { TOOL_NAMES } from '@/constants';

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
      return renderToolResult({
        status,
        result,
        schema: TipsResultSchema,
        loading: <ToolLoading target={`local tips in ${args.city || args.country}`} />,
        invalidMessage: 'Received an unexpected local tips result.',
        isEmpty: (data) => data.count === 0,
        emptyMessage: 'No local tips were available for this destination.',
        render: (data) => (
          <>
            <SetLastTool toolName={TOOL_NAMES.LOCAL_TIPS} />
            <LocalTipsCard data={data} />
          </>
        ),
      });
    },
  });
};
