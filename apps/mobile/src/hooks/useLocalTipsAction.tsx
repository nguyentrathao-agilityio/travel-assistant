import { z } from 'zod';

// Constants
import { TOOL_NAMES } from '@repo/constants';

// Schemas
import { TipsResultSchema } from '@repo/schemas';

// Components
import { renderToolResult } from '../components/common/renderToolResult';
import { LocalTipsCard } from '../components/LocalTipsCard';

// Hooks
import { useRenderToolResult } from './useRenderToolResult';

const localTipsParameters = z.object({
  city: z.string().optional(),
  country: z.string().optional(),
  category: z.string().optional(),
  essential_only: z.boolean().optional(),
});

export const useLocalTipsAction = () => {
  useRenderToolResult({
    name: TOOL_NAMES.LOCAL_TIPS,
    schema: localTipsParameters,
    render: ({ status, result }) =>
      renderToolResult({
        status,
        result,
        schema: TipsResultSchema,
        invalidMessage: 'Received an unexpected local tips result.',
        isEmpty: (data) => data.count === 0,
        emptyMessage: 'No local tips were available for this destination.',
        render: (data) => <LocalTipsCard data={data} />,
      }),
  });
};
