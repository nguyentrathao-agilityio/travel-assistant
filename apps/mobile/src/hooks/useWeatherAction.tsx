import { TOOL_NAMES } from '@repo/constants';
import { WeatherResultSchema } from '@repo/schemas';
import { z } from 'zod';

import { renderToolResult } from '../components/common/renderToolResult';
import { WeatherCard } from '../components/WeatherCard';
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
