import { defineToolCallRenderer, useCopilotKit } from '@copilotkit/react-native/headless';
import { useEffect } from 'react';

// Types
import type { ToolCallStatus } from '@copilotkit/react-native/headless';
import type { ReactElement } from 'react';
import type { z } from 'zod';

interface RenderToolCallProps<Args> {
  status: ToolCallStatus;
  result: string | undefined;
  args: Partial<Args>;
}

interface UseRenderToolResultOptions<Output> {
  name: string;
  schema: z.ZodType<Output>;
  render: (props: RenderToolCallProps<Output>) => ReactElement;
}

export const useRenderToolResult = <Output>(
  { name, schema, render }: UseRenderToolResultOptions<Output>,
  deps: ReadonlyArray<unknown> = []
): void => {
  const { copilotkit } = useCopilotKit();

  useEffect(() => {
    copilotkit.addHookRenderToolCall(
      defineToolCallRenderer({
        name,
        args: schema,
        render: (props) => render({ status: props.status, result: props.result, args: props.args }),
      })
    );
    // `render` is intentionally excluded — it's captured at registration and only
    // refreshed when `deps` changes, matching @copilotkit/react-core's own useRenderTool.
  }, [name, copilotkit, schema, JSON.stringify(deps)]);
};
