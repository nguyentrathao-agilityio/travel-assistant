import { z } from 'zod';

import { TranscriptPageSchema } from '@repo/schemas';

import { transcriptStore } from '@/infrastructure/persistence';

import { getVoiceAudioService } from './voice-audio';
import {
  InvalidTranscriptCursorError,
  fetchTranscriptPage as fetchTranscriptPageService,
} from '@/services/transcript';

import type { Hono } from 'hono';
import type { TranscriptPage } from '@repo/schemas';

interface TranscriptRouteLogger {
  info(message: string, metadata: Record<string, unknown>): void;
  error(message: string, metadata: Record<string, unknown>): void;
}

interface TranscriptRouteDependencies {
  fetchPage(threadId: string, cursor: string | null, limit: number): Promise<TranscriptPage>;
  deleteThread(threadId: string): Promise<void>;
  deleteThreadAudio(threadId: string): Promise<void>;
  logger: TranscriptRouteLogger;
}

const querySchema = z.object({
  before: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const defaultDependencies: TranscriptRouteDependencies = {
  fetchPage: (threadId, cursor, limit) => fetchTranscriptPageService(threadId, cursor, limit),
  deleteThread: (threadId) => transcriptStore.deleteThread(threadId),
  deleteThreadAudio: (threadId) => getVoiceAudioService().deleteThreadAudio(threadId),
  logger: console,
};

const elapsedMs = (startedAt: number): number => Date.now() - startedAt;

export const registerTranscriptRoutes = (
  app: Hono,
  dependencies: TranscriptRouteDependencies = defaultDependencies
): void => {
  app.get('/threads/:threadId/messages', async (context) => {
    const startedAt = Date.now();
    const query = querySchema.safeParse(context.req.query());

    if (!query.success) return context.json({ error: 'invalid_query' }, 400);

    const { threadId } = context.req.param();

    try {
      const result = await dependencies.fetchPage(
        threadId,
        query.data.before ?? null,
        query.data.limit
      );
      const parsed = TranscriptPageSchema.safeParse(result);

      if (!parsed.success) {
        dependencies.logger.error('[transcript-api]', {
          operation: 'page',
          status: 'invalid_response',
          durationMs: elapsedMs(startedAt),
        });
        return context.json({ error: 'invalid_transcript_response' }, 500);
      }

      dependencies.logger.info('[transcript-api]', {
        operation: 'page',
        status: 'success',
        durationMs: elapsedMs(startedAt),
        resultCount: parsed.data.messages.length,
      });
      context.header('Cache-Control', 'private, no-store');
      return context.json(parsed.data);
    } catch (error) {
      const invalidCursor = error instanceof InvalidTranscriptCursorError;
      dependencies.logger.error('[transcript-api]', {
        operation: 'page',
        status: 'error',
        durationMs: elapsedMs(startedAt),
        errorType: error instanceof Error ? error.name : 'UnknownError',
      });
      return context.json(
        { error: invalidCursor ? 'invalid_cursor' : 'transcript_unavailable' },
        invalidCursor ? 400 : 500
      );
    }
  });

  app.delete('/threads/:threadId/messages', async (context) => {
    const startedAt = Date.now();
    const { threadId } = context.req.param();

    try {
      await dependencies.deleteThread(threadId);
      await dependencies.deleteThreadAudio(threadId).catch((error: unknown) => {
        dependencies.logger.error('[transcript-api]', {
          operation: 'delete-audio',
          status: 'error',
          errorType: error instanceof Error ? error.name : 'UnknownError',
        });
      });
      dependencies.logger.info('[transcript-api]', {
        operation: 'delete',
        status: 'success',
        durationMs: elapsedMs(startedAt),
      });
      return context.body(null, 204);
    } catch (error) {
      dependencies.logger.error('[transcript-api]', {
        operation: 'delete',
        status: 'error',
        durationMs: elapsedMs(startedAt),
        errorType: error instanceof Error ? error.name : 'UnknownError',
      });
      return context.json({ error: 'transcript_unavailable' }, 500);
    }
  });
};
