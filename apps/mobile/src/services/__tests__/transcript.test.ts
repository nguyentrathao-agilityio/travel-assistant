import { FetchTimeoutError } from '../../utils/fetchWithTimeout';
import {
  TranscriptRequestError,
  fetchTranscriptPage,
  isTransientTranscriptError,
} from '../transcript';

const page = {
  messages: [
    { id: 'u1', role: 'user', content: 'Hello' },
    { id: 'a1', role: 'assistant', content: 'Hi' },
  ],
  previousCursor: 'cursor-1',
  hasPreviousPage: true,
};

const mockFetch = (body: unknown, status = 200) =>
  jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }));

beforeEach(() => {
  process.env.EXPO_PUBLIC_RUNTIME_URL = 'http://192.0.2.1:8123/chat';
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('requests the newest page with an encoded thread ID', async () => {
  const fetchMock = mockFetch(page);

  await fetchTranscriptPage('thread/1', null);

  expect(fetchMock).toHaveBeenCalledWith(
    'http://192.0.2.1:8123/threads/thread%2F1/messages?limit=20',
    expect.anything()
  );
});

test('passes an older-page cursor as the before parameter', async () => {
  const fetchMock = mockFetch(page);

  await fetchTranscriptPage('thread-1', 'a+b/c=');

  expect(fetchMock).toHaveBeenCalledWith(
    'http://192.0.2.1:8123/threads/thread-1/messages?limit=20&before=a%2Bb%2Fc%3D',
    expect.anything()
  );
});

test('returns the validated page in ascending server order', async () => {
  mockFetch(page);

  const result = await fetchTranscriptPage('thread-1', null);

  expect(result.messages.map((message) => message.id)).toEqual(['u1', 'a1']);
  expect(result.previousCursor).toBe('cursor-1');
});

test('rejects a response that does not match the transcript schema', async () => {
  mockFetch({ messages: [{ id: 'x', role: 'system', content: 'secret' }] });

  await expect(fetchTranscriptPage('thread-1', null)).rejects.toThrow();
});

test('surfaces the HTTP status of a failed request', async () => {
  mockFetch({ error: 'invalid_cursor' }, 400);

  await expect(fetchTranscriptPage('thread-1', 'bad')).rejects.toMatchObject({
    name: 'TranscriptRequestError',
    status: 400,
  });
});

test('treats timeouts, network failures, and 5xx responses as transient', () => {
  expect(isTransientTranscriptError(new FetchTimeoutError())).toBe(true);
  expect(isTransientTranscriptError(new TypeError('Network request failed'))).toBe(true);
  expect(isTransientTranscriptError(new TranscriptRequestError(503))).toBe(true);
  expect(isTransientTranscriptError(new TranscriptRequestError(400))).toBe(false);
  expect(isTransientTranscriptError(new Error('schema'))).toBe(false);
});
