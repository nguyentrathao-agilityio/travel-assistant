// Types
import type { Message } from '@copilotkit/react-native/headless';

// Tool results are keyed by their call ID because live and archived tool messages may carry different IDs.
const messageKey = (message: Message): string =>
  message.role === 'tool' && message.toolCallId ? `tool:${message.toolCallId}` : message.id;

/** Merges archive and live messages: older live first, then archive (live copies win), then new live. */
export const reconcileMessages = (archived: Message[], live: Message[]): Message[] => {
  const archivedKeys = new Set(archived.map(messageKey));
  const firstOverlap = live.findIndex((message) => archivedKeys.has(messageKey(message)));
  const leading = firstOverlap > 0 ? live.slice(0, firstOverlap) : [];
  const liveByKey = new Map(live.map((message) => [messageKey(message), message]));
  const seen = new Set<string>();
  const result: Message[] = [];

  for (const message of [...leading, ...archived, ...live]) {
    const key = messageKey(message);

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(liveByKey.get(key) ?? message);
  }

  return result;
};
