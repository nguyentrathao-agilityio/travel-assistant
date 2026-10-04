import { streamVoiceTurn, voiceTurnUrl } from '../voiceTurn';

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));
jest.mock('../../storage', () => ({ getApiKey: jest.fn().mockResolvedValue('sk-test') }));

process.env.EXPO_PUBLIC_RUNTIME_URL = 'http://agent.test:8123/chat';

const encoder = new TextEncoder();

const streamingResponse = (chunks: string[], status = 200) => ({
  body: {
    getReader: () => {
      let index = 0;

      return {
        read: async () =>
          index < chunks.length
            ? { done: false, value: encoder.encode(chunks[index++]) }
            : { done: true, value: undefined },
        releaseLock: () => {},
      };
    },
  },
  json: async () => ({ error: 'missing_key' }),
  ok: status >= 200 && status < 300,
  status,
});

describe('streamVoiceTurn', () => {
  it('derives the endpoint from the runtime URL', () => {
    expect(voiceTurnUrl()).toBe('http://agent.test:8123/voice/turn');
  });

  it('posts with BYOK and emits parsed events, skipping invalid ones', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(
        streamingResponse([
          'data: {"type":"agent_chunk","text":"Hi"}\n\n',
          'data: {"type":"nope"}\n\ndata: {"type":"speech_end"}\n\n',
        ])
      );
    const onEvent = jest.fn();

    await streamVoiceTurn({
      body: { threadId: 't', transcript: 'hi' },
      fetchImpl: fetchImpl as never,
      onEvent,
      signal: new AbortController().signal,
    });

    const [url, init] = fetchImpl.mock.calls[0];

    expect(url).toBe('http://agent.test:8123/voice/turn');
    expect(init.headers['x-openai-api-key']).toBe('sk-test');
    expect(JSON.parse(init.body)).toEqual({ threadId: 't', transcript: 'hi' });
    expect(onEvent.mock.calls.map(([event]) => event.type)).toEqual(['agent_chunk', 'speech_end']);
  });

  it('throws VoiceTurnHttpError with the server code on a non-OK response', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(streamingResponse([], 400));

    await expect(
      streamVoiceTurn({
        body: { threadId: 't', transcript: 'hi' },
        fetchImpl: fetchImpl as never,
        onEvent: jest.fn(),
        signal: new AbortController().signal,
      })
    ).rejects.toMatchObject({ code: 'missing_key', name: 'VoiceTurnHttpError', status: 400 });
  });
});
