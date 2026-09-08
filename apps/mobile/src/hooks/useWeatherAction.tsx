import { z } from 'zod';

// Constants
import { TOOL_NAMES } from '@repo/constants';

// Schemas
import { WeatherResultSchema } from '@repo/schemas';

// Components
import { renderToolResult } from '../components/common/renderToolResult';
import { WeatherCard } from '../components/WeatherCard';

// Hooks
import { useRenderToolResult } from './useRenderToolResult';

const weatherParameters = z.object({
  city: z.string().optional(),
  days: z.number().optional(),
});

export const useWeatherAction = () => {
  useRenderToolResult({
    name: TOOL_NAMES.WEATHER,
    schema: weatherParameters,
    render: ({ status, result }) =>
      renderToolResult({
        status,
        result,
        schema: WeatherResultSchema,
        invalidMessage: 'Received an unexpected weather result.',
        render: (data) => <WeatherCard data={data} />,
      }),
  });
};
