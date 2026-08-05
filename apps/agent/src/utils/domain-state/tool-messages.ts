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
