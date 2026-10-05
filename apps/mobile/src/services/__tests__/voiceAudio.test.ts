import {
  VoiceAudioUnavailableError,
  fetchVoiceAudioList,
  fetchVoiceAudioPlaybackUrl,
  uploadVoiceRecording,
} from '../voiceAudio';

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));
jest.mock('../../storage', () => ({ getApiKey: jest.fn().mockResolvedValue('sk-test') }));

process.env.EXPO_PUBLIC_RUNTIME_URL = 'http://192.168.1.10:8123/chat';

const json = (status: number, body: unknown) =>
  ({ json: async () => body, ok: status >= 200 && status < 300, status }) as Response;

const recording = { byteLength: 4, chunks: [new ArrayBuffer(4)] };

describe('uploadVoiceRecording', () => {
  it('asks for a URL, PUTs the WAV directly, then confirms the upload', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(json(200, { uploadUrl: 'https://bucket.example/put' }))
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 204 });

    await uploadVoiceRecording({ messageId: 'm1', recording, threadId: 't1' }, fetchImpl);

    const [urlCall, putCall, completeCall] = fetchImpl.mock.calls;
    expect(urlCall[0]).toBe('http://192.168.1.10:8123/voice/audio/upload-url');
    expect(JSON.parse(urlCall[1].body)).toEqual({
      byteLength: 48,
      durationMs: 1,
      messageId: 'm1',
      threadId: 't1',
    });
    expect(urlCall[1].headers['x-openai-api-key']).toBe('sk-test');
    expect(putCall[0]).toBe('https://bucket.example/put');
    expect(putCall[1]).toMatchObject({ headers: { 'Content-Type': 'audio/wav' }, method: 'PUT' });
    expect((putCall[1].body as ArrayBuffer).byteLength).toBe(48);
    expect(completeCall[0]).toBe('http://192.168.1.10:8123/voice/audio/complete');
  });

  it('throws when the bucket rejects the upload so the caller can log it', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(json(200, { uploadUrl: 'https://bucket.example/put' }))
      .mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(
      uploadVoiceRecording({ messageId: 'm1', recording, threadId: 't1' }, fetchImpl)
    ).rejects.toThrow();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe('fetchVoiceAudioList / fetchVoiceAudioPlaybackUrl', () => {
  it('reads recordings and playback URLs', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(json(200, { recordings: [{ durationMs: 900, messageId: 'm1' }] }))
      .mockResolvedValueOnce(json(200, { url: 'https://bucket.example/get' }));

    await expect(fetchVoiceAudioList('t1', fetchImpl)).resolves.toEqual([
      { durationMs: 900, messageId: 'm1' },
    ]);
    await expect(fetchVoiceAudioPlaybackUrl('t1', 'm1', fetchImpl)).resolves.toBe(
      'https://bucket.example/get'
    );
    expect(fetchImpl.mock.calls[1][0]).toBe('http://192.168.1.10:8123/voice/audio/t1/m1/url');
  });

  it('maps 503 to VoiceAudioUnavailableError', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(json(503, { error: 'voice_audio_unavailable' }));

    await expect(fetchVoiceAudioList('t1', fetchImpl)).rejects.toBeInstanceOf(
      VoiceAudioUnavailableError
    );
  });
});
