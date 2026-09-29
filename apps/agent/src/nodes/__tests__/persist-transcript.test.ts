import {
  AIMessage,
  AIMessageChunk,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { describe, expect, it, vi } from 'vitest';

import { SUMMARY_MESSAGE_PREFIX } from '@repo/constants';

import { createPersistTranscriptNode } from '@/nodes/persist-transcript';

const runtime = (threadId?: string) =>
  ({ configurable: threadId ? { thread_id: threadId } : {} }) as never;

describe('persistTranscriptNode', () => {
  it('persists supported transcript messages once after a completed outer run', async () => {
    const appendMissing = vi.fn().mockResolvedValue(undefined);
    const persistTranscript = createPersistTranscriptNode({ appendMissing } as never);
    const assistant = new AIMessage({
      id: 'a1',
      content: '',
      tool_calls: [{ id: 'c1', name: 'weatherTool', args: { city: 'Hue' }, type: 'tool_call' }],
    });

    const result = await persistTranscript(
      {
        messages: [
          new HumanMessage({ id: 'u1', content: 'Weather in Hue' }),
          assistant,
          new ToolMessage({ id: 't1', content: 'Sunny', tool_call_id: 'c1' }),
        ],
      } as never,
      runtime('thread-1')
    );

    expect(result).toEqual({});
    expect(appendMissing).toHaveBeenCalledTimes(1);
    expect(appendMissing).toHaveBeenCalledWith('thread-1', [
      expect.objectContaining({ id: 'u1', role: 'user' }),
      expect.objectContaining({ id: 'a1', role: 'assistant', toolCalls: assistant.tool_calls }),
      expect.objectContaining({ id: 't1', role: 'tool', toolCallId: 'c1' }),
    ]);
  });

  it('keeps streamed assistant chunks while filtering summaries and unsupported messages', async () => {
    const appendMissing = vi.fn().mockResolvedValue(undefined);
    const persistTranscript = createPersistTranscriptNode({ appendMissing } as never);

    await persistTranscript(
      {
        messages: [
          new SystemMessage({ id: 'system-1', content: 'Rules' }),
          new HumanMessage({
            id: 'summary-1',
            content: `${SUMMARY_MESSAGE_PREFIX}\n\nEarlier context`,
          }),
          new HumanMessage('No stable ID'),
          new AIMessageChunk({ id: 'a1', content: 'Visible response' }),
        ],
      } as never,
      runtime('thread-1')
    );

    expect(appendMissing).toHaveBeenCalledWith('thread-1', [
      expect.objectContaining({ id: 'a1', role: 'assistant', content: 'Visible response' }),
    ]);
  });

  it('skips persistence without a thread ID', async () => {
    const appendMissing = vi.fn();
    const persistTranscript = createPersistTranscriptNode({ appendMissing } as never);

    await expect(
      persistTranscript(
        { messages: [new HumanMessage({ id: 'u1', content: 'Hello' })] } as never,
        runtime()
      )
    ).resolves.toEqual({});
    expect(appendMissing).not.toHaveBeenCalled();
  });

  it('logs metadata only and does not fail the outer graph when persistence fails', async () => {
    const appendMissing = vi.fn().mockRejectedValue(new TypeError('secret message body'));
    const logger = { error: vi.fn() };
    const persistTranscript = createPersistTranscriptNode({ appendMissing } as never, logger);

    await expect(
      persistTranscript(
        { messages: [new HumanMessage({ id: 'u1', content: 'private text' })] } as never,
        runtime('thread-1')
      )
    ).resolves.toEqual({});
    expect(logger.error).toHaveBeenCalledWith('[transcript-persistence]', {
      errorType: 'TypeError',
      threadId: 'thread-1',
    });
  });
});
