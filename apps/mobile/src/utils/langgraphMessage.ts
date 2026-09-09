// Constants
import { TOOL_NAMES } from '@repo/constants';

// Types
import type { AssistantMessageType, Message } from '@copilotkit/react-native/headless';

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
  artifact?: unknown;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  additional_kwargs?: {
    tool_calls?: ToolCall[];
  };
};

export type LangGraphThreadValues = { messages?: LangGraphRawMessage[] };

const LEGACY_TOOL_NAMES: Readonly<Record<string, string>> = {
  searchFlights: TOOL_NAMES.FLIGHTS,
  search_flights: TOOL_NAMES.FLIGHTS,
  searchHotels: TOOL_NAMES.HOTEL,
  search_hotels: TOOL_NAMES.HOTEL,
  searchPlaces: TOOL_NAMES.PLACES,
  search_places: TOOL_NAMES.PLACES,
  getWeather: TOOL_NAMES.WEATHER,
  get_weather: TOOL_NAMES.WEATHER,
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
 * threads.get()'s `values.messages`) into this app's AG-UI `Message` shape.
 * Returns null for message types we don't render (system, unnamed roles) or
 * empty content with no tool calls. Mirrors apps/web's toAgUiMessage exactly —
 * both sides convert the same LangGraph checkpoint shape into the same AG-UI wire format.
 */
export const toAgUiMessage = (message: LangGraphRawMessage, fallbackId: string): Message | null => {
  const role = message.role ?? message.type ?? '';
  const id = message.id ?? fallbackId;
  const content = langgraphMessageText(message.content);

  if (role === 'user' || role === 'human') {
    return content.trim() ? { id, role: 'user', content } : null;
  }

  if (role === 'assistant' || role === 'ai') {
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

    const result: AssistantMessageType = { id, role: 'assistant' };

    if (content.trim()) result.content = content;
    if (toolCalls?.length) result.toolCalls = toolCalls;

    return result;
  }

  if (role === 'tool' && message.tool_call_id) {
    return {
      id,
      role: 'tool',
      toolCallId: message.tool_call_id,
      content: langgraphToolContent(message.artifact ?? message.content),
    };
  }

  return null;
};
