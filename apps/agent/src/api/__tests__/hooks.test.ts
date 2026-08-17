import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ErrorHookContext,
  HandlerHookContext,
  HookContext,
  ResponseHookContext,
} from '@copilotkit/runtime/v2';

import { createCopilotKitHooks } from '@/api/hooks';

const REQUEST_START_HEADER_NAME = 'x-cpk-request-start';

const makeRequest = (headers: Record<string, string> = {}): Request =>
  new Request('https://example.com/chat', { method: 'POST', headers });

let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const hooks = createCopilotKitHooks(['travelAgent']);

describe('onRequest (stampRequestStart)', () => {
  it('stamps a numeric start-time header on the request and logs the arrival', async () => {
    const request = makeRequest();

    const stamped = (await hooks.onRequest?.({
      request,
      path: '/chat',
    } as unknown as HookContext)) as Request;

    expect(Number(stamped.headers.get(REQUEST_START_HEADER_NAME))).toBeGreaterThan(0);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('POST /chat'));
  });
});

describe('onBeforeHandler (rejectUnregisteredAgent)', () => {
  it.each(['agent/run', 'agent/connect', 'agent/stop'] as const)(
    'throws a 400 Response for an unregistered agentId on %s',
    (method) => {
      expect(() =>
        hooks.onBeforeHandler?.({
          route: { method, agentId: 'unknownAgent' },
        } as unknown as HandlerHookContext)
      ).toThrow(Response);
    }
  );

  it.each(['agent/run', 'agent/connect', 'agent/stop'] as const)(
    'does not throw for a registered agentId on %s',
    (method) => {
      expect(() =>
        hooks.onBeforeHandler?.({
          route: { method, agentId: 'travelAgent' },
        } as unknown as HandlerHookContext)
      ).not.toThrow();
    }
  );

  it('does not throw for methods that are not agent-scoped, regardless of agentId', () => {
    expect(() =>
      hooks.onBeforeHandler?.({
        route: { method: 'threads/list', agentId: 'unknownAgent' },
      } as unknown as HandlerHookContext)
    ).not.toThrow();
  });

  it('rejects with a 400 status and a JSON body naming the unknown agentId', async () => {
    expect.assertions(3);

    try {
      hooks.onBeforeHandler?.({
        route: { method: 'agent/run', agentId: 'unknownAgent' },
      } as unknown as HandlerHookContext);
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(Response);
      const response = thrown as Response;

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: 'invalid_request',
        message: "Unknown agentId 'unknownAgent'",
      });
    }
  });
});

describe('onResponse (logResponse)', () => {
  it('logs a duration derived from the stamped start-time header', () => {
    const startedAt = Date.now() - 100;
    const request = makeRequest({ [REQUEST_START_HEADER_NAME]: String(startedAt) });
    const response = new Response(null, { status: 200 });

    hooks.onResponse?.({
      request,
      response,
      route: { method: 'agent/run' },
    } as unknown as ResponseHookContext);

    const [message] = logSpy.mock.calls[0] as [string];

    expect(message).toContain('-> 200 ');
    const [, elapsedMsStr] = message.match(/(\d+)ms$/) ?? [];

    expect(Number(elapsedMsStr)).toBeGreaterThanOrEqual(100);
  });

  it('falls back to 0ms when the start-time header is not a valid number', () => {
    const request = makeRequest({ [REQUEST_START_HEADER_NAME]: 'not-a-number' });
    const response = new Response(null, { status: 200 });

    hooks.onResponse?.({
      request,
      response,
      route: { method: 'agent/run' },
    } as unknown as ResponseHookContext);

    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/ 0ms$/));
  });
});

describe('onError (logError)', () => {
  it('logs the error context without throwing, even with no resolved route', () => {
    const request = makeRequest();

    expect(() =>
      hooks.onError?.({
        request,
        error: new Error('boom'),
        path: '/chat',
        route: undefined,
      } as unknown as ErrorHookContext)
    ).not.toThrow();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('unresolved'), expect.any(Error));
  });
});
