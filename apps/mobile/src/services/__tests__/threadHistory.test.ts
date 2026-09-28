import { AGENT_NAME } from '@repo/constants';

import {
  findEmptyThreadId,
  keepNewestEmptyThread,
  deleteRemoteThread,
  renameRemoteThread,
  toThreadItem,
} from '../threadHistory';

import type { ThreadItem } from '../threadHistory';
import type { Thread } from '@langchain/langgraph-sdk';

jest.mock('../langgraphClient', () => ({
  getLanggraphClient: jest.fn(),
}));

import { getLanggraphClient } from '../langgraphClient';

const rawThread = (overrides: Partial<Thread> = {}): Thread =>
  ({
    thread_id: 't1',
    created_at: '2026-09-15T00:00:00.000Z',
    metadata: {},
    values: {},
    ...overrides,
  }) as Thread;

const thread = (id: string, title: string | null): ThreadItem => ({
  createdAt: `2026-09-15T00:00:0${id}.000Z`,
  id,
  title,
});

test('reuses the newest empty conversation when starting a new chat', () => {
  const threads = [thread('3', null), thread('2', 'Plan Hanoi'), thread('1', null)];

  expect(findEmptyThreadId(threads)).toBe('3');
});

test('keeps completed conversations and only the newest empty conversation', () => {
  const threads = [
    thread('4', null),
    thread('3', 'Plan Tokyo'),
    thread('2', null),
    thread('1', 'Plan Da Nang'),
  ];

  expect(keepNewestEmptyThread(threads)).toEqual([threads[0], threads[1], threads[3]]);
});

test('toThreadItem prefers a custom title over the first human message', () => {
  const item = toThreadItem(
    rawThread({
      metadata: { customTitle: 'My trip to Hoi An' },
      values: { messages: [{ type: 'human', content: 'Plan a trip to Da Nang' }] },
    })
  );

  expect(item.title).toBe('My trip to Hoi An');
});

test('toThreadItem falls back to the first human message when no custom title is set', () => {
  const item = toThreadItem(
    rawThread({ values: { messages: [{ type: 'human', content: 'Plan a trip to Da Nang' }] } })
  );

  expect(item.title).toBe('Plan a trip to Da Nang');
});

test('toThreadItem ignores a blank custom title', () => {
  const item = toThreadItem(rawThread({ metadata: { customTitle: '   ' } }));

  expect(item.title).toBeNull();
});

test('renameRemoteThread updates metadata with the trimmed title and keeps resourceId', async () => {
  const update = jest.fn().mockResolvedValue(undefined);

  (getLanggraphClient as jest.Mock).mockReturnValue({ threads: { update } });

  await renameRemoteThread('t1', '  Hoi An getaway  ');

  expect(update).toHaveBeenCalledWith('t1', {
    metadata: { resourceId: AGENT_NAME, customTitle: 'Hoi An getaway' },
  });
});

test('deleteRemoteThread removes the LangGraph thread and its transcript', async () => {
  const deleteThread = jest.fn().mockResolvedValue(undefined);
  const fetchMock = jest
    .spyOn(global, 'fetch')
    .mockResolvedValue(new Response(null, { status: 204 }));
  process.env.EXPO_PUBLIC_RUNTIME_URL = 'http://192.0.2.1:8123';
  (getLanggraphClient as jest.Mock).mockReturnValue({ threads: { delete: deleteThread } });

  await deleteRemoteThread('thread/1');

  expect(deleteThread).toHaveBeenCalledWith('thread/1');
  expect(fetchMock).toHaveBeenCalledWith(
    'http://192.0.2.1:8123/threads/thread%2F1/messages',
    expect.objectContaining({ method: 'DELETE' })
  );
  fetchMock.mockRestore();
});
