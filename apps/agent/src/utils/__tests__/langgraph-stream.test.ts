import { describe, expect, it } from 'vitest';

// Utils
import { isAiMessage, messageContentText, parseStreamEvent } from '@/utils/langgraph-stream';

describe('langgraph-stream utils', () => {
  it('splits a namespaced stream event into kind, namespace and top node', () => {
    expect(parseStreamEvent('messages|plan:1|model_request:2')).toEqual({
      kind: 'messages',
      namespace: ['plan:1', 'model_request:2'],
      topNode: 'plan',
    });
    expect(parseStreamEvent('updates')).toEqual({ kind: 'updates', namespace: [], topNode: '' });
  });

  it('joins text parts and ignores non-text content', () => {
    expect(messageContentText('Hi')).toBe('Hi');
    expect(messageContentText([{ text: 'Hel' }, { type: 'image' }, { text: 'lo' }])).toBe('Hello');
    expect(messageContentText(null)).toBe('');
  });

  it('recognises AI messages and chunks only', () => {
    expect(isAiMessage({ type: 'ai' })).toBe(true);
    expect(isAiMessage({ type: 'AIMessageChunk' })).toBe(true);
    expect(isAiMessage({ type: 'tool' })).toBe(false);
  });
});
