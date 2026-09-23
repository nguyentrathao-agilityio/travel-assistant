import type { Message, ToolMessage } from '@copilotkit/react-native/headless';

export type RenderableMessage = Message & { role: 'user' | 'assistant' };

/** Chat bubbles only ever show user/assistant turns — tool results are folded
 * into the assistant message's tool-call rendering, never their own bubble. */
export const renderableMessages = (messages: Message[]): RenderableMessage[] =>
  messages.filter((message): message is RenderableMessage => {
    return message.role === 'user' || message.role === 'assistant';
  });

export const findToolMessage = (messages: Message[], toolCallId: string): ToolMessage | undefined =>
  messages.find(
    (message): message is ToolMessage =>
      message.role === 'tool' && message.toolCallId === toolCallId
  );

// One pass instead of a linear scan per tool-call row — build once per messages change.
export const buildToolMessageIndex = (messages: Message[]): Map<string, ToolMessage> => {
  const index = new Map<string, ToolMessage>();

  for (const message of messages) {
    if (message.role === 'tool') index.set(message.toolCallId, message);
  }

  return index;
};

/** A message's `content` is either plain text or an array of typed parts
 * (text/image/audio/...) — only the text parts render as chat-bubble text. */
export const messageText = (content: RenderableMessage['content']): string => {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  return content
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
};
