import { langgraphMessageText, toAgUiMessage } from '../langgraphMessage';

import { TOOL_NAMES } from '@repo/constants';

import type { LangGraphRawMessage } from '../langgraphMessage';

type ToolCallsResult = {
  toolCalls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
};

const toolCallsOf = (message: LangGraphRawMessage, fallbackId: string) =>
  (toAgUiMessage(message, fallbackId) as ToolCallsResult | null)?.toolCalls;

describe('langgraphMessageText', () => {
  test('returns the string content unchanged', () => {
    expect(langgraphMessageText('hello')).toBe('hello');
  });

  test('joins text parts from a content-part array', () => {
    const content = [
      { type: 'text', text: 'Hello, ' },
      { type: 'text', text: 'world!' },
    ];

    expect(langgraphMessageText(content)).toBe('Hello, world!');
  });

  test('ignores non-text parts in a content-part array', () => {
    const content = [
      { type: 'text', text: 'Hello' },
      { type: 'image_url', image_url: { url: 'https://example.com/a.png' } },
    ];

    expect(langgraphMessageText(content)).toBe('Hello');
  });

  test('returns an empty string for content that is neither a string nor an array', () => {
    expect(langgraphMessageText(undefined)).toBe('');
    expect(langgraphMessageText(null)).toBe('');
    expect(langgraphMessageText({ type: 'text', text: 'no' })).toBe('');
    expect(langgraphMessageText(42)).toBe('');
  });

  test('returns an empty string for an empty array', () => {
    expect(langgraphMessageText([])).toBe('');
  });
});

describe('toAgUiMessage', () => {
  test('converts a human message with content', () => {
    const message: LangGraphRawMessage = { id: 'm1', role: 'human', content: 'Plan a trip' };

    expect(toAgUiMessage(message, 'fallback')).toEqual({
      id: 'm1',
      role: 'user',
      content: 'Plan a trip',
    });
  });

  test('converts a message using the "user" role the same as "human"', () => {
    const message: LangGraphRawMessage = { id: 'm1', role: 'user', content: 'Plan a trip' };

    expect(toAgUiMessage(message, 'fallback')?.role).toBe('user');
  });

  test('uses the fallback id when the message has no id', () => {
    const message: LangGraphRawMessage = { role: 'human', content: 'Hi' };

    expect(toAgUiMessage(message, 'fallback-id')?.id).toBe('fallback-id');
  });

  test('drops a user message with blank content', () => {
    const message: LangGraphRawMessage = { id: 'm1', role: 'human', content: '   ' };

    expect(toAgUiMessage(message, 'fallback')).toBeNull();
  });

  test('converts an assistant message with content only', () => {
    const message: LangGraphRawMessage = { id: 'm1', role: 'ai', content: 'Sure, here you go.' };

    expect(toAgUiMessage(message, 'fallback')).toEqual({
      id: 'm1',
      role: 'assistant',
      content: 'Sure, here you go.',
    });
  });

  test('converts an assistant message using tool_calls', () => {
    const message: LangGraphRawMessage = {
      id: 'm1',
      role: 'assistant',
      content: '',
      tool_calls: [{ id: 'call-1', name: TOOL_NAMES.WEATHER, args: { city: 'Hanoi' } }],
    };

    expect(toAgUiMessage(message, 'fallback')).toEqual({
      id: 'm1',
      role: 'assistant',
      toolCalls: [
        {
          id: 'call-1',
          type: 'function',
          function: { name: TOOL_NAMES.WEATHER, arguments: JSON.stringify({ city: 'Hanoi' }) },
        },
      ],
    });
  });

  test('falls back to additional_kwargs.tool_calls when tool_calls is empty', () => {
    const message: LangGraphRawMessage = {
      id: 'm1',
      role: 'assistant',
      content: '',
      tool_calls: [],
      additional_kwargs: {
        tool_calls: [{ id: 'call-1', function: { name: TOOL_NAMES.WEATHER, arguments: '{}' } }],
      },
    };

    expect(toolCallsOf(message, 'fallback')).toEqual([
      {
        id: 'call-1',
        type: 'function',
        function: { name: TOOL_NAMES.WEATHER, arguments: '{}' },
      },
    ]);
  });

  test('normalizes legacy tool names on assistant tool calls', () => {
    const message: LangGraphRawMessage = {
      id: 'm1',
      role: 'assistant',
      content: '',
      tool_calls: [{ id: 'call-1', name: 'search_flights', args: {} }],
    };

    expect(toolCallsOf(message, 'fallback')?.[0]?.function.name).toBe(TOOL_NAMES.FLIGHTS);
  });

  test('keeps string tool call arguments as-is instead of double-encoding', () => {
    const message: LangGraphRawMessage = {
      id: 'm1',
      role: 'assistant',
      content: '',
      tool_calls: [{ id: 'call-1', name: TOOL_NAMES.WEATHER, args: '{"city":"Hanoi"}' }],
    };

    expect(toolCallsOf(message, 'fallback')?.[0]?.function.arguments).toBe('{"city":"Hanoi"}');
  });

  test('filters out tool calls missing an id or a name', () => {
    const message: LangGraphRawMessage = {
      id: 'm1',
      role: 'assistant',
      content: '',
      tool_calls: [
        { id: 'call-1', args: {} },
        { name: TOOL_NAMES.WEATHER, args: {} },
      ],
    };

    expect(toAgUiMessage(message, 'fallback')).toBeNull();
  });

  test('includes both content and toolCalls when both are present', () => {
    const message: LangGraphRawMessage = {
      id: 'm1',
      role: 'assistant',
      content: 'Let me check the weather.',
      tool_calls: [{ id: 'call-1', name: TOOL_NAMES.WEATHER, args: {} }],
    };
    const result = toAgUiMessage(message, 'fallback');

    expect(result?.content).toBe('Let me check the weather.');
    expect((result as ToolCallsResult | null)?.toolCalls).toHaveLength(1);
  });

  test('drops an assistant message with no content and no tool calls', () => {
    const message: LangGraphRawMessage = { id: 'm1', role: 'assistant', content: '' };

    expect(toAgUiMessage(message, 'fallback')).toBeNull();
  });

  test('converts a tool message using artifact when present', () => {
    const message: LangGraphRawMessage = {
      id: 'm1',
      role: 'tool',
      tool_call_id: 'call-1',
      content: 'ignored',
      artifact: { temp: 30 },
    };

    expect(toAgUiMessage(message, 'fallback')).toEqual({
      id: 'm1',
      role: 'tool',
      toolCallId: 'call-1',
      content: JSON.stringify({ temp: 30 }),
    });
  });

  test('converts a tool message using content when there is no artifact', () => {
    const message: LangGraphRawMessage = {
      id: 'm1',
      role: 'tool',
      tool_call_id: 'call-1',
      content: 'sunny',
    };

    expect(toAgUiMessage(message, 'fallback')).toEqual({
      id: 'm1',
      role: 'tool',
      toolCallId: 'call-1',
      content: 'sunny',
    });
  });

  test('drops a tool message with no tool_call_id', () => {
    const message: LangGraphRawMessage = { id: 'm1', role: 'tool', content: 'sunny' };

    expect(toAgUiMessage(message, 'fallback')).toBeNull();
  });

  test('returns null for an unrecognized role', () => {
    const message: LangGraphRawMessage = { id: 'm1', role: 'system', content: 'ignored' };

    expect(toAgUiMessage(message, 'fallback')).toBeNull();
  });

  test('falls back to message.type when role is absent', () => {
    const message: LangGraphRawMessage = { id: 'm1', type: 'ai', content: 'Hi there' };

    expect(toAgUiMessage(message, 'fallback')).toEqual({
      id: 'm1',
      role: 'assistant',
      content: 'Hi there',
    });
  });
});
