import { describe, expect, it, vi } from 'vitest';

import { createLangGraphRunner, type RunRequest } from '../langgraph-runner';

const payloadFor = async (request: RunRequest) => {
  const stream = vi.fn(async function* (..._args: unknown[]) {});
  const runner = createLangGraphRunner({
    apiKey: 'sk-test',
    client: { runs: { stream } } as never,
    threadId: 't1',
  });

  for await (const _event of runner.run(request, new AbortController().signal)) {
    // Drain the run.
  }

  return stream.mock.calls[0]![2] as unknown as { input: { messages: unknown[] } };
};

describe('createLangGraphRunner', () => {
  it('uses the client message id for the user message', async () => {
    const payload = await payloadFor({ kind: 'input', messageId: 'm-1', transcript: 'hi' });

    expect(payload.input.messages).toEqual([{ content: 'hi', id: 'm-1', role: 'user' }]);
  });

  it('omits the id when the client sends none', async () => {
    const payload = await payloadFor({ kind: 'input', transcript: 'hi' });

    expect(payload.input.messages).toEqual([{ content: 'hi', role: 'user' }]);
  });
});
