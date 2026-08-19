import { useRenderTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

// Constants
import { TOOL_NAMES } from '@/constants';

// Utils
import { getToolError, isToolPending, safeParseToolResult } from '@/utils';

// Schemas
import { WeatherResultSchema } from '@repo/schemas';

// Components
import {
  SetLastTool,
  ToolErrorCard,
  ToolInvalidResultCard,
  WeatherCard,
  ToolLoading,
} from '@/components';

const weatherParameters = z.object({
  city: z.string().optional(),
  days: z.number().optional(),
});

export const useWeatherAction = () => {
  useRenderTool({
    name: TOOL_NAMES.WEATHER,
    parameters: weatherParameters,
    render: ({ status, result, parameters: args }) => {
      if (isToolPending(status))
        return <ToolLoading target={`weather in ${args.city} for ${args.days || 5} days`} />;

      if (getToolError(result)) return <ToolErrorCard result={result} />;

      const parsed = safeParseToolResult(WeatherResultSchema, result);

      if (!parsed.success)
        return <ToolInvalidResultCard message="Received an unexpected weather result." />;

      return (
        <>
          <SetLastTool toolName={TOOL_NAMES.WEATHER} />
          <WeatherCard data={parsed.data} />
        </>
      );
    },
  });
};
