import { useRenderTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

// Constants
import { TOOL_NAMES } from '@/constants';

// Utils
// Schemas
import { WeatherResultSchema } from '@repo/schemas';

// Components
import { SetLastTool, WeatherCard, ToolLoading } from '@/components';
import { renderToolResult } from '@/components/common/ToolResultBoundary';

const weatherParameters = z.object({
  city: z.string().optional(),
  days: z.number().optional(),
});

export const useWeatherAction = () => {
  useRenderTool({
    name: TOOL_NAMES.WEATHER,
    parameters: weatherParameters,
    render: ({ status, result, parameters: args }) => {
      return renderToolResult({
        status,
        result,
        schema: WeatherResultSchema,
        loading: <ToolLoading target={`weather in ${args.city} for ${args.days || 5} days`} />,
        invalidMessage: 'Received an unexpected weather result.',
        render: (data) => (
          <>
            <SetLastTool toolName={TOOL_NAMES.WEATHER} />
            <WeatherCard data={data} />
          </>
        ),
      });
    },
  });
};
