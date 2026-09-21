import { groupThreadsByDate } from '../groupThreadsByDate';

import type { ThreadItem } from '../../services';

const NOW = new Date('2026-01-15T12:00:00Z');

const thread = (id: string, createdAt: string): ThreadItem => ({
  id,
  title: `Trip ${id}`,
  createdAt,
});

test('buckets threads into Today, Yesterday, Last 7 Days, and Older', () => {
  const threads = [
    thread('today', '2026-01-15T09:00:00Z'),
    thread('yesterday', '2026-01-14T09:00:00Z'),
    thread('within-week', '2026-01-10T09:00:00Z'),
    thread('older', '2026-01-01T09:00:00Z'),
  ];

  expect(groupThreadsByDate(threads, NOW)).toEqual([
    { title: 'Today', data: [threads[0]] },
    { title: 'Yesterday', data: [threads[1]] },
    { title: 'Last 7 Days', data: [threads[2]] },
    { title: 'Older', data: [threads[3]] },
  ]);
});

test('omits sections with no threads', () => {
  const threads = [thread('today', '2026-01-15T09:00:00Z')];

  expect(groupThreadsByDate(threads, NOW)).toEqual([{ title: 'Today', data: threads }]);
});

test('returns no sections for an empty list', () => {
  expect(groupThreadsByDate([], NOW)).toEqual([]);
});

test('the 7-day boundary falls into Older, not Last 7 Days', () => {
  const threads = [thread('boundary', '2026-01-08T09:00:00Z')];

  expect(groupThreadsByDate(threads, NOW)).toEqual([{ title: 'Older', data: threads }]);
});
