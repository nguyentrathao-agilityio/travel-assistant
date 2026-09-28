import {
  AIMessage,
  AIMessageChunk,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { describe, expect, it, vi } from 'vitest';

import { SUMMARY_MESSAGE_PREFIX } from '@repo/constants';

import { createTranscriptMiddleware } from '@/agent/middleware/transcript';

const runtime = (threadId?: string) =>
  ({ configurable: threadId ? { thread_id: threadId } : {} }) as never;
const afterAgentOf = (middleware: ReturnType<typeof createTranscriptMiddleware>) =>
  middleware.afterAgent as (state: never, runtime: never) => Promise<void>;

describe('transcript middleware', () => {
  it('persists user, assistant, and tool messages after a completed run', async () => {
    const appendMissing = vi.fn().mockResolvedValue(undefined);
    const middleware = createTranscriptMiddleware({ appendMissing } as never);
    const assistant = new AIMessage({
      id: 'a1',
      content: '',
      tool_calls: [{ id: 'c1', name: 'weatherTool', args: { city: 'Hue' }, type: 'tool_call' }],
    });

    await afterAgentOf(middleware)(
      {
        messages: [
          new HumanMessage({ id: 'u1', content: 'Weather in Hue' }),
          assistant,
          new ToolMessage({ id: 't1', content: 'Sunny', tool_call_id: 'c1' }),
        ],
      } as never,
      runtime('thread-1')
    );

    expect(appendMissing).toHaveBeenCalledWith('thread-1', [
      expect.objectContaining({ id: 'u1', role: 'user' }),
      expect.objectContaining({ id: 'a1', role: 'assistant', toolCalls: assistant.tool_calls }),
      expect.objectContaining({ id: 't1', role: 'tool', toolCallId: 'c1' }),
    ]);
  });

  it('persists streamed assistant chunks, which are not AIMessage instances', async () => {
    const appendMissing = vi.fn().mockResolvedValue(undefined);
    const middleware = createTranscriptMiddleware({ appendMissing } as never);

    await afterAgentOf(middleware)(
      {
        messages: [
          new HumanMessage({ id: 'u1', content: 'Places in Da Nang' }),
          new AIMessageChunk({
            id: 'a1',
            content: '',
            tool_calls: [{ id: 'c1', name: 'placesTool', args: {}, type: 'tool_call' }],
          }),
          new ToolMessage({ id: 't1', content: '{}', tool_call_id: 'c1' }),
          new AIMessageChunk({ id: 'a2', content: 'There are 8 places.' }),
        ],
      } as never,
      runtime('thread-1')
    );

    expect(appendMissing.mock.calls[0][1].map((message: { id: string }) => message.id)).toEqual([
      'u1',
      'a1',
      't1',
      'a2',
    ]);
  });

  it('does not archive a summary even when lc_source metadata is missing', async () => {
    const appendMissing = vi.fn().mockResolvedValue(undefined);
    const middleware = createTranscriptMiddleware({ appendMissing } as never);

    await afterAgentOf(middleware)(
      {
        messages: [
          new HumanMessage({
            id: 's1',
            content: `${SUMMARY_MESSAGE_PREFIX}\n\nEarlier: flights to Hue.`,
          }),
          new HumanMessage({ id: 'u1', content: 'Hotels?' }),
        ],
      } as never,
      runtime('thread-1')
    );

    expect(appendMissing.mock.calls[0][1].map((message: { id: string }) => message.id)).toEqual([
      'u1',
    ]);
  });

  it('ignores system, summary, and ID-less messages', async () => {
    const appendMissing = vi.fn().mockResolvedValue(undefined);
    const middleware = createTranscriptMiddleware({ appendMissing } as never);

    await afterAgentOf(middleware)(
      {
        messages: [
          new SystemMessage({ id: 'system-1', content: 'Rules' }),
          new HumanMessage({
            id: 'summary-1',
            content: 'Summary',
            additional_kwargs: { lc_source: 'summarization' },
          }),
          new HumanMessage('No stable ID'),
        ],
      } as never,
      runtime('thread-1')
    );

    expect(appendMissing).toHaveBeenCalledWith('thread-1', []);
  });

  it('skips persistence when thread ID is unavailable', async () => {
    const appendMissing = vi.fn();
    const middleware = createTranscriptMiddleware({ appendMissing } as never);

    await afterAgentOf(middleware)(
      { messages: [new HumanMessage({ id: 'u1', content: 'Hello' })] } as never,
      runtime()
    );

    expect(appendMissing).not.toHaveBeenCalled();
  });

  it('logs metadata only and does not fail the run when persistence fails', async () => {
    const appendMissing = vi.fn().mockRejectedValue(new TypeError('secret message body'));
    const logger = { error: vi.fn() };
    const middleware = createTranscriptMiddleware({ appendMissing } as never, logger);

    await expect(
      afterAgentOf(middleware)(
        { messages: [new HumanMessage({ id: 'u1', content: 'private text' })] } as never,
        runtime('thread-1')
      )
    ).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith('[transcript-persistence]', {
      errorType: 'TypeError',
      threadId: 'thread-1',
    });
  });
});
