import { TOOL_NAMES } from '@repo/constants';
import { PlacesSearchResultSchema } from '@repo/schemas';
import { z } from 'zod';

import { renderToolResult } from '../components/common/renderToolResult';
import { PlacesCard } from '../components/PlacesCard';
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
