import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { createMiddleware } from 'langchain';

import { SUMMARY_MESSAGE_PREFIX } from '@repo/constants';

import { transcriptStore } from '@/infrastructure/persistence';

import type { TranscriptStoreApi } from '@/infrastructure/persistence';
import type { TranscriptMessage } from '@repo/schemas';

interface TranscriptLogger {
  error(message: string, metadata: Record<string, unknown>): void;
}

const isSummaryMessage = (message: HumanMessage): boolean =>
  message.additional_kwargs.lc_source === 'summarization' ||
  (typeof message.content === 'string' && message.content.startsWith(SUMMARY_MESSAGE_PREFIX));

const toTranscriptMessage = (message: unknown): TranscriptMessage | null => {
  if (HumanMessage.isInstance(message)) {
    if (!message.id || isSummaryMessage(message)) return null;
    return { id: message.id, role: 'user', content: message.content };
  }

  if (AIMessage.isInstance(message)) {
    if (!message.id) return null;
    return {
      id: message.id,
      role: 'assistant',
      content: message.content,
      ...(message.tool_calls?.length ? { toolCalls: message.tool_calls } : {}),
    };
  }

  if (ToolMessage.isInstance(message)) {
    if (!message.id) return null;
    return {
      id: message.id,
      role: 'tool',
      content: message.content,
      toolCallId: message.tool_call_id,
    };
  }

  return null;
};

export const createTranscriptMiddleware = (
  store: TranscriptStoreApi = transcriptStore,
  logger: TranscriptLogger = console
) =>
  createMiddleware({
    name: 'TranscriptPersistence',
    afterAgent: async (state, runtime) => {
      const threadId = runtime.configurable?.thread_id;
      if (typeof threadId !== 'string' || !threadId) return;

      const messages = state.messages.flatMap((message) => {
        const converted = toTranscriptMessage(message);
        return converted ? [converted] : [];
      });

      try {
        await store.appendMissing(threadId, messages);
      } catch (error) {
        logger.error('[transcript-persistence]', {
          errorType: error instanceof Error ? error.name : 'UnknownError',
          threadId,
        });
      }
    },
  });
