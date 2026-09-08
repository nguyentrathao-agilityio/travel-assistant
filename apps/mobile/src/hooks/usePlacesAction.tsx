import { z } from 'zod';

// Constants
import { TOOL_NAMES } from '@repo/constants';

// Schemas
import { PlacesSearchResultSchema } from '@repo/schemas';

// Components
import { renderToolResult } from '../components/common/renderToolResult';
import { PlacesCard } from '../components/PlacesCard';

// Hooks
import { useRenderToolResult } from './useRenderToolResult';

const placesParameters = z.object({
  city: z.string().optional(),
  category: z.string().optional(),
  price_level: z.number().optional(),
});

export const usePlacesAction = () => {
  useRenderToolResult({
    name: TOOL_NAMES.PLACES,
    schema: placesParameters,
    render: ({ status, result }) =>
      renderToolResult({
        status,
        result,
        schema: PlacesSearchResultSchema,
        invalidMessage: 'Received an unexpected places result.',
        isEmpty: (data) => data.total === 0,
        emptyMessage: 'No places matched this search.',
        render: (data) => <PlacesCard data={data} />,
      }),
  });
};
