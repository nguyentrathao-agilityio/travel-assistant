import { createMiddleware } from 'langchain';

// Constants
import {
  OBSERVABILITY_EVENT,
  OBSERVABILITY_OPERATIONS,
  OBSERVABILITY_STATUSES,
  UNKNOWN_ERROR_TYPE,
} from '@/constants';

interface ObservabilityLogger {
  info: (message: string, metadata: Record<string, unknown>) => void;
  error: (message: string, metadata: Record<string, unknown>) => void;
}

const elapsedMs = (startedAt: number): number => Date.now() - startedAt;

const errorType = (error: unknown): string =>
  error instanceof Error ? error.name : UNKNOWN_ERROR_TYPE;

/** Records model and tool timings without logging prompts, arguments, results, or raw errors. */
export const createObservabilityMiddleware = (
  agentName: string,
  logger: ObservabilityLogger = console
) =>
  createMiddleware({
    name: `observability-${agentName}`,
    wrapModelCall: async (request, handler) => {
      const startedAt = Date.now();

      try {
        const response = await handler(request);

        logger.info(OBSERVABILITY_EVENT, {
          agent: agentName,
          operation: OBSERVABILITY_OPERATIONS.MODEL,
          status: OBSERVABILITY_STATUSES.SUCCESS,
          durationMs: elapsedMs(startedAt),
        });

        return response;
      } catch (error) {
        logger.error(OBSERVABILITY_EVENT, {
          agent: agentName,
          operation: OBSERVABILITY_OPERATIONS.MODEL,
          status: OBSERVABILITY_STATUSES.ERROR,
          durationMs: elapsedMs(startedAt),
          errorType: errorType(error),
        });

        throw error;
      }
    },
    wrapToolCall: async (request, handler) => {
      const startedAt = Date.now();
      const tool = request.toolCall.name;

      try {
        const response = await handler(request);

        logger.info(OBSERVABILITY_EVENT, {
          agent: agentName,
          operation: OBSERVABILITY_OPERATIONS.TOOL,
          tool,
          status: OBSERVABILITY_STATUSES.SUCCESS,
          durationMs: elapsedMs(startedAt),
        });

        return response;
      } catch (error) {
        logger.error(OBSERVABILITY_EVENT, {
          agent: agentName,
          operation: OBSERVABILITY_OPERATIONS.TOOL,
          tool,
          status: OBSERVABILITY_STATUSES.ERROR,
          durationMs: elapsedMs(startedAt),
          errorType: errorType(error),
        });

        throw error;
      }
    },
  });
