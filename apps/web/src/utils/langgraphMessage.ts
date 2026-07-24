import { CHAT_ROLE } from '@/constants';
import type { AgUiAssistantMessage, AgUiMessage } from '@/types';

type ToolCall = {
  id?: string;
  name?: string;
  args?: unknown;
  function?: {
    name?: string;
    arguments?: unknown;
  };
};

export type LangGraphRawMessage = {
  id?: string;
  role?: string;
  type?: string;
  content?: unknown;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  additional_kwargs?: {
    tool_calls?: ToolCall[];
  };
};

export type LangGraphThreadValues = { messages?: LangGraphRawMessage[] };

const LEGACY_TOOL_NAMES: Readonly<Record<string, string>> = {
  searchFlights: 'flightsTool',
  search_flights: 'flightsTool',
  searchHotels: 'hotelTool',
  search_hotels: 'hotelTool',
  searchPlaces: 'placesTool',
  search_places: 'placesTool',
  getWeather: 'weatherTool',
  get_weather: 'weatherTool',
};

const normalizeToolName = (name: string): string => LEGACY_TOOL_NAMES[name] ?? name;

const toolCallArguments = (call: ToolCall): string => {
  const value = call.args ?? call.function?.arguments ?? {};
  if (typeof value === 'string') return value;

  return JSON.stringify(value);
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

const langgraphToolContent = (content: unknown): string => {
  if (typeof content === 'string') return content;

  try {
    return JSON.stringify(content);
  } catch {
    return String(content);
  }
};

/**
 * Converts a raw LangGraph checkpoint message (BaseMessage-shaped JSON, from
 * threads.get()'s `values.messages`) into this app's AgUiMessage shape.
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
    const rawToolCalls = message.tool_calls?.length
      ? message.tool_calls
      : (message.additional_kwargs?.tool_calls ?? []);
    const toolCalls = rawToolCalls
      ?.filter(
        (call): call is ToolCall & { id: string } =>
          !!call.id && !!(call.name ?? call.function?.name)
      )
      .map((call) => ({
        id: call.id,
        type: 'function' as const,
        function: {
          name: normalizeToolName(call.name ?? call.function?.name ?? ''),
          arguments: toolCallArguments(call),
        },
      }));

    if (!content.trim() && !toolCalls?.length) return null;

    const result: AgUiAssistantMessage = { id, role: CHAT_ROLE.ASSISTANT };
    if (content.trim()) result.content = content;
    if (toolCalls?.length) result.toolCalls = toolCalls;

    return result;
  }

  if (role === CHAT_ROLE.TOOL && message.tool_call_id) {
    return {
      id,
      role: CHAT_ROLE.TOOL,
      toolCallId: message.tool_call_id,
      content: langgraphToolContent(message.content),
    };
  }

  return null;
};
