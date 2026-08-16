import { isToolPending, isUserMessage, extractCopilotText, stableMessageKey } from '@/utils/agent';
import type { ConversationChatMessage } from '@/hooks';

jest.mock('@/constants', () => ({
  CHAT_ROLE: { USER: 'user', ASSISTANT: 'assistant', TOOL: 'tool' },
  TOOL_STATUS: { IN_PROGRESS: 'inProgress', EXECUTING: 'executing', COMPLETE: 'complete' },
}));

describe('isToolPending', () => {
  it('returns true for inProgress status', () => {
    expect(isToolPending('inProgress')).toBe(true);
  });

  it('returns true for executing status', () => {
    expect(isToolPending('executing')).toBe(true);
  });

  it('returns false for complete status', () => {
    expect(isToolPending('complete')).toBe(false);
  });

  it('returns false for unknown status', () => {
    expect(isToolPending('idle')).toBe(false);
  });
});

describe('isUserMessage', () => {
  it('returns true for a user message object', () => {
    expect(isUserMessage({ role: 'user', content: 'hello' })).toBe(true);
  });

  it('returns false for an assistant message', () => {
    expect(isUserMessage({ role: 'assistant', content: 'hi' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isUserMessage(null)).toBe(false);
  });

  it('returns false for a plain string', () => {
    expect(isUserMessage('user')).toBe(false);
  });

  it('returns false for an object without role', () => {
    expect(isUserMessage({ content: 'hello' })).toBe(false);
  });
});

describe('extractCopilotText', () => {
  it('returns a plain string as-is', () => {
    expect(extractCopilotText('hello world')).toBe('hello world');
  });

  it('extracts text from a ContentPart array', () => {
    const parts = [{ type: 'text', text: 'hi there' }];
    expect(extractCopilotText(parts)).toBe('hi there');
  });

  it('returns first text part when multiple parts exist', () => {
    const parts = [
      { type: 'text', text: 'first' },
      { type: 'text', text: 'second' },
    ];
    expect(extractCopilotText(parts)).toBe('first');
  });

  it('returns empty string when no text part found', () => {
    const parts = [{ type: 'image' }];
    expect(extractCopilotText(parts)).toBe('');
  });

  it('returns empty string for empty array', () => {
    expect(extractCopilotText([])).toBe('');
  });
});

describe('stableMessageKey', () => {
  it('returns the tool call id for an assistant message with exactly one tool call', () => {
    const message = {
      id: 'chatcmpl-abc',
      role: 'assistant',
      toolCalls: [
        { id: 'call_123', type: 'function', function: { name: 'flightsTool', arguments: '{}' } },
      ],
    } as unknown as ConversationChatMessage;

    expect(stableMessageKey(message, 0)).toBe('assistant:call_123');
  });

  it('returns a toolCallId-derived key for a tool response message', () => {
    const message = {
      id: 'run-1-tool-call_123',
      role: 'tool',
      toolCallId: 'call_123',
      content: '{}',
    } as unknown as ConversationChatMessage;

    expect(stableMessageKey(message, 0)).toBe('tool:call_123');
  });

  it('keys an assistant tool call and its tool response differently even when they share a tool-call id', () => {
    const assistantMessage = {
      id: 'chatcmpl-abc',
      role: 'assistant',
      toolCalls: [
        { id: 'call_123', type: 'function', function: { name: 'flightsTool', arguments: '{}' } },
      ],
    } as unknown as ConversationChatMessage;
    const toolMessage = {
      id: 'run-1-tool-call_123',
      role: 'tool',
      toolCallId: 'call_123',
      content: '{}',
    } as unknown as ConversationChatMessage;

    expect(stableMessageKey(assistantMessage, 0)).not.toBe(stableMessageKey(toolMessage, 1));
  });

  it('falls back to message.id for a user message', () => {
    const message = {
      id: 'user-1',
      role: 'user',
      content: 'hello',
    } as unknown as ConversationChatMessage;

    expect(stableMessageKey(message, 0)).toBe('user-1');
  });

  it('falls back to message.id for an assistant message with more than one tool call', () => {
    const message = {
      id: 'chatcmpl-multi',
      role: 'assistant',
      toolCalls: [
        { id: 'call_1', type: 'function', function: { name: 'flightsTool', arguments: '{}' } },
        { id: 'call_2', type: 'function', function: { name: 'weatherTool', arguments: '{}' } },
      ],
    } as unknown as ConversationChatMessage;

    expect(stableMessageKey(message, 0)).toBe('chatcmpl-multi');
  });

  it('falls back to the index when message.id is missing', () => {
    const message = { role: 'user', content: 'hello' } as unknown as ConversationChatMessage;

    expect(stableMessageKey(message, 3)).toBe('3');
  });
});
