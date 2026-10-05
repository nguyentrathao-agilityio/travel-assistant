import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InvalidTranscriptCursorError } from '@/services/transcript';
import { registerTranscriptRoutes } from '../transcript';

const page = { messages: [], previousCursor: null, hasPreviousPage: false };

describe('transcript routes', () => {
  const fetchPage = vi.fn();
  const deleteThread = vi.fn();
  const deleteThreadAudio = vi.fn().mockResolvedValue(undefined);
  const logger = { info: vi.fn(), error: vi.fn() };
  const createApp = () => {
    const app = new Hono();
    registerTranscriptRoutes(app, { fetchPage, deleteThread, deleteThreadAudio, logger });
    return app;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fetchPage.mockResolvedValue(page);
    deleteThread.mockResolvedValue(undefined);
  });

  it('returns the newest page with private caching disabled', async () => {
    const response = await createApp().request('/threads/thread-1/messages?limit=20');

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(fetchPage).toHaveBeenCalledWith('thread-1', null, 20);
    expect(await response.json()).toEqual(page);
  });

  it.each(['0', '51', 'nope'])('rejects invalid limit %s', async (limit) => {
    const response = await createApp().request(`/threads/thread-1/messages?limit=${limit}`);
    expect(response.status).toBe(400);
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it('maps an invalid cursor to a typed 400 response', async () => {
    fetchPage.mockRejectedValue(new InvalidTranscriptCursorError());

    const response = await createApp().request('/threads/thread-1/messages?before=broken');

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid_cursor' });
  });

  it('rejects an invalid service response', async () => {
    fetchPage.mockResolvedValue({ messages: [], previousCursor: null, hasPreviousPage: true });

    const response = await createApp().request('/threads/thread-1/messages');

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'invalid_transcript_response' });
  });

  it('deletes a transcript idempotently', async () => {
    const app = createApp();

    expect((await app.request('/threads/thread-1/messages', { method: 'DELETE' })).status).toBe(
      204
    );
    expect((await app.request('/threads/thread-1/messages', { method: 'DELETE' })).status).toBe(
      204
    );
    expect(deleteThread).toHaveBeenCalledTimes(2);
    expect(deleteThread).toHaveBeenCalledWith('thread-1');
  });

  it('deletes thread audio best-effort when the transcript is deleted', async () => {
    deleteThread.mockResolvedValue(undefined);
    deleteThreadAudio.mockRejectedValueOnce(new Error('bucket down'));

    const response = await createApp().request('/threads/t1/messages', { method: 'DELETE' });

    expect(response.status).toBe(204);
    expect(deleteThread).toHaveBeenCalledWith('t1');
    expect(deleteThreadAudio).toHaveBeenCalledWith('t1');
  });
});
