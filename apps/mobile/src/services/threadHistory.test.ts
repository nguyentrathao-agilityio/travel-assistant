import assert from 'node:assert/strict';
import test from 'node:test';

import { findEmptyThreadId, keepNewestEmptyThread } from './threadHistory';

import type { ThreadItem } from './threadHistory';

const thread = (id: string, title: string | null): ThreadItem => ({
  createdAt: `2026-09-15T00:00:0${id}.000Z`,
  id,
  title,
});

test('reuses the newest empty conversation when starting a new chat', () => {
  const threads = [thread('3', null), thread('2', 'Plan Hanoi'), thread('1', null)];

  assert.equal(findEmptyThreadId(threads), '3');
});

test('keeps completed conversations and only the newest empty conversation', () => {
  const threads = [
    thread('4', null),
    thread('3', 'Plan Tokyo'),
    thread('2', null),
    thread('1', 'Plan Da Nang'),
  ];

  assert.deepEqual(keepNewestEmptyThread(threads), [threads[0], threads[1], threads[3]]);
});
