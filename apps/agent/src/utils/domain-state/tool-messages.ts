import { HumanMessage, ToolMessage } from '@langchain/core/messages';

const BOOKING_EDIT_REJECTION_PREFIX = 'The user requested changes.';
const BOOKING_REQUEST_CANCELLATION_PREFIX = 'The user cancelled the booking request.';
const CANCELLATION_REJECTION_PREFIX = 'The user rejected the cancellation.';

/** Distinguishes a deliberate HITL rejection from a provider/tool failure. */
export const isIntentionalBookingRejection = (message: ToolMessage): boolean => {
  if (message.status !== 'error' || typeof message.content !== 'string') return false;

  return (
    message.content.startsWith(BOOKING_EDIT_REJECTION_PREFIX) ||
    message.content.startsWith(BOOKING_REQUEST_CANCELLATION_PREFIX) ||
    message.content.startsWith(CANCELLATION_REJECTION_PREFIX)
  );
};

/** Returns only tool results produced after the latest user message. */
export const latestTurnToolMessages = (messages: readonly unknown[]): ToolMessage[] => {
  let lastHumanIndex = -1;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index] instanceof HumanMessage) {
      lastHumanIndex = index;
      break;
    }
  }

  return messages
    .slice(lastHumanIndex + 1)
    .filter((message): message is ToolMessage => message instanceof ToolMessage);
};

/** Deduplicates this turn's tool results to the latest call per tool name. */
export const latestResultPerTool = (messages: readonly unknown[]): ToolMessage[] => {
  const seen = new Set<string>();
  const latest: ToolMessage[] = [];
  const turnMessages = latestTurnToolMessages(messages);

  for (let index = turnMessages.length - 1; index >= 0; index -= 1) {
    const message = turnMessages[index];
    const name = message.name ?? 'unknownTool';

    if (seen.has(name)) continue;
    seen.add(name);
    latest.push(message);
  }

  return latest;
};
