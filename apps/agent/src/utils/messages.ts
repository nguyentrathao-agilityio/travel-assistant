import { ToolMessage, type BaseMessage } from '@langchain/core/messages';

// Extends backward past any leading ToolMessage so the window never starts mid tool-call pair.
export const takeRecentMessages = (messages: BaseMessage[], count: number): BaseMessage[] => {
  let start = Math.max(messages.length - count, 0);
  while (start > 0 && messages[start] instanceof ToolMessage) start--;
  return messages.slice(start);
};
