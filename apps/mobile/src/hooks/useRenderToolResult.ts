import { defineToolCallRenderer, useCopilotKit } from '@copilotkit/react-native/headless';
import { useEffect } from 'react';

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

/**
 * Render-only registration for a backend tool's result — no competing frontend tool.
 *
 * `useRenderTool` from `@copilotkit/react-native/headless` goes through `useFrontendTool`,
 * which declares a *frontend* tool under the same name as the backend one (it needs a
 * `description`, unlike web's version, precisely because it's a real tool declaration).
 * That name collision breaks the backend tool's actual result on every render — the
 * fix here is the same primitive web's plain `useRenderTool` (from `@copilotkit/react-core`)
 * calls internally: `CopilotKitCoreReact.addHookRenderToolCall`, bypassing frontend-tool
 * registration entirely.
 */
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
