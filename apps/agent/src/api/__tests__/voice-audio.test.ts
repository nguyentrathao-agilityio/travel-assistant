import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { VOICE_AUDIO_MAX_BYTES } from '@repo/constants';

import { registerVoiceAudioRoutes } from '../voice-audio';
import { VoiceAudioMissingError, VoiceAudioUnavailableError } from '@/services/voice-audio';
import type { VoiceAudioService } from '@/services/voice-audio';

const body = { byteLength: 48044, durationMs: 1000, messageId: 'm1', threadId: 't1' };

const makeService = (overrides: Partial<VoiceAudioService> = {}): VoiceAudioService => ({
  completeUpload: vi.fn().mockResolvedValue(undefined),
  createPlaybackUrl: vi.fn().mockResolvedValue('https://signed/get'),
  createUploadUrl: vi.fn().mockResolvedValue('https://signed/put'),
  deleteThreadAudio: vi.fn().mockResolvedValue(undefined),
  listRecordings: vi.fn().mockResolvedValue([{ durationMs: 1000, messageId: 'm1' }]),
  ...overrides,
});

const appWith = (service: VoiceAudioService) => {
  const app = new Hono();

  registerVoiceAudioRoutes(app, { service });

  return app;
};

const request = (
  app: Hono,
  path: string,
  init: RequestInit = {},
  apiKey: string | null = 'sk-test'
) =>
  app.request(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-openai-api-key': apiKey } : {}),
    },
  });

const postJson = (app: Hono, path: string, payload: unknown, apiKey?: string | null) =>
  request(app, path, { body: JSON.stringify(payload), method: 'POST' }, apiKey);

describe('voice audio routes', () => {
  it('rejects requests without a key', async () => {
    const response = await postJson(appWith(makeService()), '/voice/audio/upload-url', body, null);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'missing_key' });
  });

  it('returns a presigned upload URL', async () => {
    const response = await postJson(appWith(makeService()), '/voice/audio/upload-url', body);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ uploadUrl: 'https://signed/put' });
  });

  it('rejects recordings over the size limit with 413', async () => {
    const service = makeService();
    const response = await postJson(appWith(service), '/voice/audio/upload-url', {
      ...body,
      byteLength: VOICE_AUDIO_MAX_BYTES + 1,
    });

    expect(response.status).toBe(413);
    expect(service.createUploadUrl).not.toHaveBeenCalled();
  });

  it('rejects an invalid body', async () => {
    const response = await postJson(appWith(makeService()), '/voice/audio/upload-url', {
      threadId: 't1',
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid_request' });
  });

  it('rejects ids that could escape the namespace or object path', async () => {
    const service = makeService();
    const app = appWith(service);

    for (const threadId of ['t_1', 't%1', '../t1']) {
      const response = await postJson(app, '/voice/audio/upload-url', { ...body, threadId });

      expect(response.status).toBe(400);
    }

    expect(service.createUploadUrl).not.toHaveBeenCalled();
  });

  it('confirms an upload, or reports it missing', async () => {
    expect((await postJson(appWith(makeService()), '/voice/audio/complete', body)).status).toBe(
      204
    );

    const missing = makeService({
      completeUpload: vi.fn().mockRejectedValue(new VoiceAudioMissingError('x')),
    });
    const response = await postJson(appWith(missing), '/voice/audio/complete', body);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'upload_missing' });
  });

  it('lists recordings and signs playback URLs', async () => {
    const app = appWith(makeService());

    expect(await (await request(app, '/voice/audio/t1')).json()).toEqual({
      recordings: [{ durationMs: 1000, messageId: 'm1' }],
    });
    expect(await (await request(app, '/voice/audio/t1/m1/url')).json()).toEqual({
      url: 'https://signed/get',
    });
  });

  it('answers 404 for an unknown recording', async () => {
    const service = makeService({
      createPlaybackUrl: vi.fn().mockRejectedValue(new VoiceAudioMissingError('x')),
    });

    expect((await request(appWith(service), '/voice/audio/t1/nope/url')).status).toBe(404);
  });

  it('returns 503 when the bucket is not configured', async () => {
    const service = makeService({
      createUploadUrl: vi.fn().mockRejectedValue(new VoiceAudioUnavailableError('x')),
      listRecordings: vi.fn().mockRejectedValue(new VoiceAudioUnavailableError('x')),
    });
    const app = appWith(service);

    expect((await postJson(app, '/voice/audio/upload-url', body)).status).toBe(503);
    expect(await (await request(app, '/voice/audio/t1')).json()).toEqual({
      error: 'voice_audio_unavailable',
    });
  });
});
