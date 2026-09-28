import { AIMessage, ToolMessage } from '@langchain/core/messages';
import { createMiddleware } from 'langchain';

// Constants
import { TOOL_MESSAGE_ORDER_MIDDLEWARE_NAME } from '@/constants';

import type { BaseMessage } from '@langchain/core/messages';

const withToolCalls = (message: AIMessage, keptIds: Set<string>): AIMessage | null => {
  const toolCalls = (message.tool_calls ?? []).filter((call) => call.id && keptIds.has(call.id));

  if (toolCalls.length === message.tool_calls?.length) return message;
  if (toolCalls.length === 0 && !message.text.trim()) return null;

  const additionalKwargs = { ...message.additional_kwargs };
  Reflect.deleteProperty(additionalKwargs, 'tool_calls');

  return new AIMessage({
    id: message.id,
    name: message.name,
    content: message.content,
    tool_calls: toolCalls,
    additional_kwargs: additionalKwargs,
    response_metadata: message.response_metadata,
  });
};

/**
 * Rebuilds message history into the shape OpenAI accepts: every tool result directly follows the
 * assistant message that requested it, in tool-call order. Unanswered tool calls and tool results
 * without a matching call are dropped. Client-seeded histories (e.g. CopilotKit suggestion runs)
 * can arrive with a tool result after the assistant's follow-up text, which OpenAI rejects with a 400.
 */
export const normalizeToolMessageOrder = (messages: BaseMessage[]): BaseMessage[] => {
  const toolResults = new Map<string, ToolMessage>();

  for (const message of messages) {
    if (ToolMessage.isInstance(message) && !toolResults.has(message.tool_call_id)) {
      toolResults.set(message.tool_call_id, message);
    }
  }

  const normalized: BaseMessage[] = [];

  for (const message of messages) {
    if (ToolMessage.isInstance(message)) continue;

    if (!AIMessage.isInstance(message) || !message.tool_calls?.length) {
      normalized.push(message);
      continue;
    }

    const answeredIds = new Set(
      message.tool_calls.flatMap((call) => (call.id && toolResults.has(call.id) ? [call.id] : []))
    );
    const assistant = withToolCalls(message, answeredIds);

    if (!assistant) continue;

    normalized.push(assistant);

    for (const callId of answeredIds) {
      normalized.push(toolResults.get(callId)!);
      toolResults.delete(callId);
    }
  }

  return normalized;
};

export const toolMessageOrderMiddleware = createMiddleware({
  name: TOOL_MESSAGE_ORDER_MIDDLEWARE_NAME,
  wrapModelCall: (request, handler) =>
    handler({ ...request, messages: normalizeToolMessageOrder(request.messages) }),
});
