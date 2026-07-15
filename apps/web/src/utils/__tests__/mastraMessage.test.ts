import { extractText, extractToolInvocations } from '@/utils/mastraMessage';
import type { MastraMessageContent } from '@/types';

describe('extractText', () => {
  it('returns a plain string as-is', () => {
    expect(extractText('hello world')).toBe('hello world');
  });

  it('extracts text from parts array', () => {
    const content: MastraMessageContent = {
      parts: [{ type: 'text', text: 'hello from parts' }],
    };
    expect(extractText(content)).toBe('hello from parts');
  });

  it('joins multiple text parts', () => {
    const content: MastraMessageContent = {
      parts: [
        { type: 'text', text: 'hello ' },
        { type: 'text', text: 'world' },
      ],
    };
    expect(extractText(content)).toBe('hello world');
  });

  it('returns empty string when parts have no text (content.content is ignored)', () => {
    const content: MastraMessageContent = {
      parts: [{ type: 'tool-invocation' } as never],
      content: 'fallback content',
    };
    expect(extractText(content)).toBe('');
  });

  it('returns empty string when content has no parts and no content field', () => {
    expect(extractText({})).toBe('');
  });

  it('ignores parts with empty text and does not fall back to content.content', () => {
    const content: MastraMessageContent = {
      parts: [{ type: 'text', text: '' }],
      content: 'fallback',
    };
    expect(extractText(content)).toBe('');
  });
});

describe('extractToolInvocations', () => {
  it('returns empty array for a plain string', () => {
    expect(extractToolInvocations('plain text')).toEqual([]);
  });

  it('returns empty array when no tool-invocation parts', () => {
    const content: MastraMessageContent = {
      parts: [{ type: 'text', text: 'hi' }],
    };
    expect(extractToolInvocations(content)).toEqual([]);
  });

  it('extracts tool invocations from parts', () => {
    const invocation = {
      state: 'result' as const,
      toolCallId: 'call-1',
      toolName: 'flightsTool',
      args: { origin: 'HAN' },
      result: { count: 3 },
    };
    const content: MastraMessageContent = {
      parts: [{ type: 'tool-invocation', toolInvocation: invocation }],
    };
    expect(extractToolInvocations(content)).toEqual([invocation]);
  });

  it('returns empty array when content has no parts', () => {
    expect(extractToolInvocations({})).toEqual([]);
  });
});
