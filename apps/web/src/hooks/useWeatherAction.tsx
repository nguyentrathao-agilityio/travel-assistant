import { useRenderToolCall } from '@copilotkit/react-core';

// Constants
import { TOOL_NAMES } from '@/constants';

// Utils
import { isToolPending } from '@/utils';

// Schemas
import { WeatherResultSchema } from '@repo/schemas';

// Components
import { SetLastTool, WeatherCard, ToolLoading } from '@/components';

export const useWeatherAction = () => {
  useRenderToolCall({
    name: TOOL_NAMES.WEATHER,
    description: 'Show current weather and forecast for a destination',
    parameters: [
      { name: 'city', type: 'string', description: 'City name', required: true },
      { name: 'days', type: 'number', description: 'Number of forecast days', required: false },
    ],
    render: ({ status, result, args }) => {
      if (isToolPending(status))
        return <ToolLoading target={`weather in ${args.city} for ${args.days || 5} days`} />;

      const parsed = WeatherResultSchema.safeParse(result);
      if (!parsed.success) return <></>;

      return (
        <>
          <SetLastTool toolName={TOOL_NAMES.WEATHER} />
          <WeatherCard data={parsed.data} />
        </>
      );
    },
  });
};
