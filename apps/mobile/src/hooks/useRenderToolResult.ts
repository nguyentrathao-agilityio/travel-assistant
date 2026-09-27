import { defineToolCallRenderer, useCopilotKit } from '@copilotkit/react-native/headless';
import { useEffect, useRef } from 'react';

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
  const renderRef = useRef(render);

  renderRef.current = render;

  useEffect(() => {
    copilotkit.addHookRenderToolCall(
      defineToolCallRenderer({
        name,
        args: schema,
        render: (props) =>
          renderRef.current({ status: props.status, result: props.result, args: props.args }),
      })
    );
    // Registration changes only when its identity/schema/deps change. The ref keeps
    // callbacks and other render-time values fresh without re-registering every render.
  }, [name, copilotkit, schema, JSON.stringify(deps)]);
};
