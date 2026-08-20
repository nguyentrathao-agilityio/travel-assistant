import { useRenderTool } from '@copilotkit/react-core/v2';

// Components
import { ToolCompletedCard, ToolErrorCard, ToolLoading } from '@/components';

// Utils
import { getToolError, isToolPending } from '@/utils';

const toolLabel = (name: string): string =>
  name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase();

/** Provides feedback for backend tools that do not have a dedicated renderer. */
export const useDefaultToolRenderer = () => {
  useRenderTool({
    name: '*',
    render: ({ name, status, result }) => {
      const label = toolLabel(name);

      if (isToolPending(status)) return <ToolLoading action="Running" target={label} />;
      if (getToolError(result)) return <ToolErrorCard result={result} />;

      const completedTool = label.charAt(0).toUpperCase() + label.slice(1);

      return <ToolCompletedCard message={`${completedTool} completed.`} />;
    },
  });
};
