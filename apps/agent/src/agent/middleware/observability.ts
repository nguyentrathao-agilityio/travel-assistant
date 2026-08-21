import { createMiddleware } from 'langchain';

interface ObservabilityLogger {
  info: (message: string, metadata: Record<string, unknown>) => void;
  error: (message: string, metadata: Record<string, unknown>) => void;
}

const elapsedMs = (startedAt: number): number => Date.now() - startedAt;

const errorType = (error: unknown): string =>
  error instanceof Error ? error.name : 'UnknownError';

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

        logger.info('[agent-observability]', {
          agent: agentName,
          operation: 'model',
          status: 'success',
          durationMs: elapsedMs(startedAt),
        });

        return response;
      } catch (error) {
        logger.error('[agent-observability]', {
          agent: agentName,
          operation: 'model',
          status: 'error',
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

        logger.info('[agent-observability]', {
          agent: agentName,
          operation: 'tool',
          tool,
          status: 'success',
          durationMs: elapsedMs(startedAt),
        });

        return response;
      } catch (error) {
        logger.error('[agent-observability]', {
          agent: agentName,
          operation: 'tool',
          tool,
          status: 'error',
          durationMs: elapsedMs(startedAt),
          errorType: errorType(error),
        });

        throw error;
      }
    },
  });
