import { CHAT_ROLE } from '@/constants';
import type { AgUiAssistantMessage, AgUiMessage } from '@/types';

type ToolCall = { id?: string; name?: string; args?: unknown };

export type LangGraphRawMessage = {
  id?: string;
  role?: string;
  type?: string;
  content?: unknown;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};

export const langgraphMessageText = (content: unknown): string => {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  return content
    .filter(
      (part): part is { type: 'text'; text: string } =>
        typeof part === 'object' &&
        part !== null &&
        'type' in part &&
        part.type === 'text' &&
        'text' in part &&
        typeof part.text === 'string'
    )
    .map((part) => part.text)
    .join('');
};

/**
 * Converts a raw LangGraph checkpoint message (BaseMessage-shaped JSON, from
 * threads.getState()'s `values.messages`) into this app's AgUiMessage shape.
 * Returns null for message types we don't render (system, unnamed roles) or
 * empty content with no tool calls.
 */
export const toAgUiMessage = (
  message: LangGraphRawMessage,
  fallbackId: string
): AgUiMessage | null => {
  const role = message.role ?? message.type ?? '';
  const id = message.id ?? fallbackId;
  const content = langgraphMessageText(message.content);

  if (role === CHAT_ROLE.USER || role === 'human') {
    return content.trim() ? { id, role: CHAT_ROLE.USER, content } : null;
  }

  if (role === CHAT_ROLE.ASSISTANT || role === 'ai') {
    const toolCalls = message.tool_calls
      ?.filter((call): call is ToolCall & { id: string; name: string } => !!call.id && !!call.name)
      .map((call) => ({
        id: call.id,
        type: 'function' as const,
        function: { name: call.name, arguments: JSON.stringify(call.args ?? {}) },
      }));

    if (!content.trim() && !toolCalls?.length) return null;

    const result: AgUiAssistantMessage = { id, role: CHAT_ROLE.ASSISTANT };
    if (content.trim()) result.content = content;
    if (toolCalls?.length) result.toolCalls = toolCalls;
    return result;
  }

  if (role === CHAT_ROLE.TOOL && message.tool_call_id) {
    return { id, role: CHAT_ROLE.TOOL, toolCallId: message.tool_call_id, content };
  }

  return null;
};
