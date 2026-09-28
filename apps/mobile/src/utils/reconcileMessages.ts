// Types
import type { Message } from '@copilotkit/react-native/headless';

// Tool results are keyed by their call ID because live and archived tool messages may carry different IDs.
const messageKey = (message: Message): string =>
  message.role === 'tool' && message.toolCallId ? `tool:${message.toolCallId}` : message.id;

/**
 * Merges archived transcript messages with live CopilotKit messages. Archive order is kept, a live
 * copy replaces its archived counterpart in place, and live messages not yet archived are appended
 * in live order. Summaries are filtered upstream (`withoutSummaryMessages`), not here.
 */
export const reconcileMessages = (archived: Message[], live: Message[]): Message[] => {
  const liveByKey = new Map(live.map((message) => [messageKey(message), message]));
  const seen = new Set<string>();
  const result: Message[] = [];

  for (const message of [...archived, ...live]) {
    const key = messageKey(message);

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(liveByKey.get(key) ?? message);
  }

  return result;
};
