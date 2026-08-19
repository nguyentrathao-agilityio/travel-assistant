import type { ReactElement } from 'react';
import type { z } from 'zod';

import { getToolError, isToolPending, safeParseToolResult } from '@/utils';

import { ToolEmptyCard, ToolErrorCard, ToolInvalidResultCard } from '../ToolResultFeedback';

interface RenderToolResultOptions<Output> {
  status: string;
  result: unknown;
  schema: z.ZodType<Output>;
  loading: ReactElement;
  invalidMessage: string;
  emptyMessage?: string;
  isEmpty?: (data: Output) => boolean;
  render: (data: Output) => ReactElement;
}

export const renderToolResult = <Output,>({
  status,
  result,
  schema,
  loading,
  invalidMessage,
  emptyMessage,
  isEmpty,
  render,
}: RenderToolResultOptions<Output>): ReactElement => {
  if (isToolPending(status)) return loading;

  if (getToolError(result)) return <ToolErrorCard result={result} />;

  const parsed = safeParseToolResult(schema, result);

  if (!parsed.success) return <ToolInvalidResultCard message={invalidMessage} />;

  if (isEmpty?.(parsed.data) && emptyMessage) return <ToolEmptyCard message={emptyMessage} />;

  return render(parsed.data);
};
