import { CallbackHandler } from '@langfuse/langchain';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import { END, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph';
import { NodeSDK, type tracing } from '@opentelemetry/sdk-node';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { withLangfuseTracing } from '../langfuse';

const LANGFUSE_ENV = { LANGFUSE_PUBLIC_KEY: 'pk-lf-test', LANGFUSE_SECRET_KEY: 'sk-lf-test' };

const exportedSpans: tracing.ReadableSpan[] = [];
const exporter: tracing.SpanExporter = {
  export: (spans, done) => {
    exportedSpans.push(...spans);
    done({ code: 0 });
  },
  shutdown: async () => {},
};
const processor = new LangfuseSpanProcessor({
  publicKey: LANGFUSE_ENV.LANGFUSE_PUBLIC_KEY,
  secretKey: LANGFUSE_ENV.LANGFUSE_SECRET_KEY,
  exporter,
  exportMode: 'immediate',
});
const sdk = new NodeSDK({ spanProcessors: [processor] });

describe('withLangfuseTracing', () => {
  beforeAll(() => sdk.start());

  afterAll(() => sdk.shutdown());

  it('runs with the original config when Langfuse credentials are absent', async () => {
    const config = { configurable: { thread_id: 'thread-123' }, tags: ['existing'] };
    const run = vi.fn(async () => 'result');
    const createHandler = vi.fn();

    await expect(
      withLangfuseTracing(config, 'planning-agent', run, {}, createHandler)
    ).resolves.toBe('result');
    expect(run).toHaveBeenCalledWith(config);
    expect(createHandler).not.toHaveBeenCalled();
  });

  it('adds tracing without dropping existing callbacks or metadata', async () => {
    const existingCallback = { name: 'existing' } as never;
    const langfuseCallback = { name: 'langfuse' } as never;
    const run = vi.fn(async () => 'result');
    const config = {
      callbacks: [existingCallback],
      configurable: { thread_id: 'thread-123' },
      metadata: { requestId: 'request-456' },
      tags: ['existing'],
    };

    await withLangfuseTracing(config, 'planning-agent', run, LANGFUSE_ENV, () => langfuseCallback);

    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({
        callbacks: [existingCallback, langfuseCallback],
        configurable: { thread_id: 'thread-123' },
        metadata: expect.objectContaining({ requestId: 'request-456' }),
        runName: 'planning-agent',
        tags: ['existing', 'travel-agent'],
      })
    );
  });

  it('keeps the thread session on nested runs while the parent graph streams messages', async () => {
    const subagent = new StateGraph(MessagesAnnotation)
      .addNode('inner', () => ({}))
      .addEdge(START, 'inner')
      .addEdge('inner', END)
      .compile();
    const parent = new StateGraph(MessagesAnnotation)
      .addNode('agent', (state, config) =>
        withLangfuseTracing(
          config,
          'booking-agent',
          (tracedConfig) => subagent.invoke(state, tracedConfig),
          LANGFUSE_ENV,
          () => new CallbackHandler()
        )
      )
      .addEdge(START, 'agent')
      .addEdge('agent', END)
      .compile();

    const stream = await parent.stream(
      { messages: [] },
      { configurable: { thread_id: 'thread-123' }, streamMode: ['messages', 'values'] }
    );

    for await (const _chunk of stream);

    await processor.forceFlush();

    const tracedSpan = exportedSpans.find(({ name }) => name === 'booking-agent');

    expect(tracedSpan?.attributes['session.id']).toBe('thread-123');
  });
});
