import { isToolPending, isUserMessage, extractCopilotText } from '@/utils/agent';

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
