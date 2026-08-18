import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

// Api
import { registerOpenAiKeyRoutes } from '../openai-key';

const request = (app: Hono, apiKey?: string) =>
  app.request('/auth/openai/verify', {
    method: 'POST',
    headers: apiKey ? { 'x-openai-api-key': apiKey } : undefined,
  });

describe('OpenAI key verification route', () => {
  it('returns valid only after provider verification succeeds', async () => {
    const verify = vi.fn().mockResolvedValue(undefined);
    const app = new Hono();
    registerOpenAiKeyRoutes(app, { verify });

    const response = await request(app, 'sk-valid');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ valid: true });
    expect(verify).toHaveBeenCalledWith('sk-valid');
  });

  it('includes CORS headers on POST responses', async () => {
    const verify = vi.fn();
    const app = new Hono();
    registerOpenAiKeyRoutes(app, { verify });

    const response = await app.request('/auth/openai/verify', {
      method: 'POST',
      headers: { Origin: 'https://web.example' },
    });

    expect(response.status).toBe(400);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  it.each([
    [undefined, 400, 'missing_key'],
    ['not-a-key', 400, 'invalid_format'],
  ] as const)('rejects malformed input without provider access', async (apiKey, status, error) => {
    const verify = vi.fn();
    const app = new Hono();
    registerOpenAiKeyRoutes(app, { verify });

    const response = await request(app, apiKey);

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ valid: false, error });
    expect(verify).not.toHaveBeenCalled();
  });

  it.each([
    [401, 401, 'invalid_key'],
    [403, 403, 'model_forbidden'],
    [429, 429, 'rate_limited'],
    [500, 503, 'verification_unavailable'],
  ] as const)(
    'maps provider status %s to a sanitized response',
    async (providerStatus, status, error) => {
      const submittedKey = 'sk-never-echo-this';
      const verify = vi
        .fn()
        .mockRejectedValue(Object.assign(new Error(submittedKey), { status: providerStatus }));
      const app = new Hono();
      registerOpenAiKeyRoutes(app, { verify });

      const response = await request(app, submittedKey);
      const body = await response.text();

      expect(response.status).toBe(status);
      expect(JSON.parse(body)).toEqual({ valid: false, error });
      expect(body).not.toContain(submittedKey);
    }
  );

  it('maps network failures without leaking the key', async () => {
    const submittedKey = 'sk-network-secret';
    const verify = vi.fn().mockRejectedValue(new Error(`network failed for ${submittedKey}`));
    const app = new Hono();
    registerOpenAiKeyRoutes(app, { verify });

    const response = await request(app, submittedKey);
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(body).toBe('{"valid":false,"error":"verification_unavailable"}');
    expect(body).not.toContain(submittedKey);
  });
});
