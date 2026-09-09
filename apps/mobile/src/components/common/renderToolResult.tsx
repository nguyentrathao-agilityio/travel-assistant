// Types
import type { ReactElement } from 'react';
import type { z } from 'zod';

// Utils
import { getToolError, getToolErrorMessage, safeParseToolResult } from '@repo/utils';
import { isToolPending } from '../../utils/toolResult';

// Components
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';

interface RenderToolResultOptions<Output> {
  status: string;
  result: unknown;
  schema: z.ZodType<Output>;
  invalidMessage: string;
  emptyMessage?: string;
  isEmpty?: (data: Output) => boolean;
  render: (data: Output) => ReactElement;
}

export const renderToolResult = <Output,>({
  status,
  result,
  schema,
  invalidMessage,
  emptyMessage,
  isEmpty,
  render,
}: RenderToolResultOptions<Output>): ReactElement => {
  if (isToolPending(status)) return <LoadingState />;

  const toolError = getToolError(result);

  if (toolError) return <ErrorState message={getToolErrorMessage(toolError)} />;

  const parsed = safeParseToolResult(schema, result);

  if (!parsed.success) return <ErrorState message={invalidMessage} />;
  if (isEmpty?.(parsed.data) && emptyMessage) return <EmptyState message={emptyMessage} />;

  return render(parsed.data);
};
