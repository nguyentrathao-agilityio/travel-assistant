import { HumanMessage, ToolMessage } from '@langchain/core/messages';

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
