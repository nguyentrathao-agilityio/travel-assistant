import { defineToolCallRenderer, useCopilotKit } from '@copilotkit/react-native/headless';
import { useEffect } from 'react';

// Types
import type { ToolCallStatus } from '@copilotkit/react-native/headless';
import type { ReactElement } from 'react';
import type { z } from 'zod';

interface RenderToolCallProps {
  status: ToolCallStatus;
  result: string | undefined;
}

interface UseRenderToolResultOptions<Output> {
  name: string;
  schema: z.ZodType<Output>;
  render: (props: RenderToolCallProps) => ReactElement;
}

export const useRenderToolResult = <Output>({
  name,
  schema,
  render,
}: UseRenderToolResultOptions<Output>): void => {
  const { copilotkit } = useCopilotKit();

  useEffect(() => {
    copilotkit.addHookRenderToolCall(
      defineToolCallRenderer({
        name,
        args: schema,
        render: (props) => render({ status: props.status, result: props.result }),
      })
    );
  }, [name, copilotkit, schema]);
};
