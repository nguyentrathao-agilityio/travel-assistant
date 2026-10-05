import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

// Api
import { registerVoiceTurnRoutes } from '../voice-turn';

import type { GraphRunner, RunRequest } from '@/voice/langgraph-runner';

const sseEvents = (body: string) =>
  body
    .split('\n')
    .filter((line) => line.startsWith('data: '))
    .map((line) => JSON.parse(line.slice(6)) as { type: string });

const appWith = (runner: GraphRunner) => {
  const createRunner = vi.fn(() => runner);
  const app = new Hono();

  registerVoiceTurnRoutes(app, { createRunner });

  return { app, createRunner };
};

const post = (app: Hono, body: unknown, apiKey: string | null = 'sk-test', signal?: AbortSignal) =>
  app.request('/voice/turn', {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-openai-api-key': apiKey } : {}),
    },
    method: 'POST',
    signal,
  });

describe('POST /voice/turn', () => {
  it('rejects a missing key and an invalid body before streaming', async () => {
    const { app, createRunner } = appWith({ async *run() {} });

    const missingKey = await post(app, { threadId: 't', transcript: 'hi' }, null);
    const invalidBody = await post(app, { threadId: 't' });

    expect(missingKey.status).toBe(400);
    expect(await missingKey.json()).toEqual({ error: 'missing_key' });
    expect(invalidBody.status).toBe(400);
    expect(await invalidBody.json()).toEqual({ error: 'invalid_request' });
    expect(createRunner).not.toHaveBeenCalled();
  });

  it('streams the turn as SSE events and passes BYOK + client date to the runner', async () => {
    const requests: RunRequest[] = [];
    const { app, createRunner } = appWith({
      async *run(request) {
        requests.push(request);
        yield { kind: 'text', text: 'Sunny tomorrow.' };
      },
    });

    const response = await post(app, {
      clientDate: '2026-10-02',
      threadId: 't1',
      transcript: 'weather?',
    });

    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(sseEvents(await response.text()).map((event) => event.type)).toEqual([
      'agent_chunk',
      'agent_end',
      'speech_segment',
      'speech_end',
    ]);
    expect(createRunner).toHaveBeenCalledWith({
      apiKey: 'sk-test',
      clientDate: '2026-10-02',
      clientTimezone: undefined,
      threadId: 't1',
    });
    expect(requests).toEqual([{ kind: 'input', transcript: 'weather?' }]);
  });

  it('passes a client message id through to the runner', async () => {
    const requests: RunRequest[] = [];
    const { app } = appWith({
      async *run(request) {
        requests.push(request);
      },
    });

    await (await post(app, { messageId: 'm-1', threadId: 't1', transcript: 'hi' })).text();

    expect(requests).toEqual([{ kind: 'input', messageId: 'm-1', transcript: 'hi' }]);
  });

  it('turns a resume body into a resume request', async () => {
    const requests: RunRequest[] = [];
    const { app } = appWith({
      async *run(request) {
        requests.push(request);
      },
    });

    await (
      await post(app, { resume: { decisions: [{ type: 'approve' }] }, threadId: 't1' })
    ).text();

    expect(requests).toEqual([{ kind: 'resume', resume: { decisions: [{ type: 'approve' }] } }]);
  });

  it('aborts the run when the client disconnects', async () => {
    let runSignal: AbortSignal | undefined;
    const { app } = appWith({
      async *run(_request, signal) {
        runSignal = signal;
        await new Promise((resolve) => signal.addEventListener('abort', resolve));
      },
    });
    const controller = new AbortController();
    const response = await post(
      app,
      { threadId: 't', transcript: 'x' },
      'sk-test',
      controller.signal
    );
    const reading = response.text().catch(() => '');

    await vi.waitFor(() => expect(runSignal).toBeDefined());
    controller.abort();
    await reading;

    await vi.waitFor(() => expect(runSignal?.aborted).toBe(true));
  });
});
