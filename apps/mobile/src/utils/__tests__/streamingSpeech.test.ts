import { collectStreamingSpeech, createStreamingSpeechState, resetStreamingSpeech } from '../voice';

test('emits a completed sentence before the response finishes', () => {
  const first = collectStreamingSpeech(createStreamingSpeechState(), {
    isComplete: false,
    messageId: 'assistant-1',
    text: 'I found three hotels. The first',
  });

  expect(first.segments).toEqual(['I found three hotels.']);

  const second = collectStreamingSpeech(first.state, {
    isComplete: false,
    messageId: 'assistant-1',
    text: 'I found three hotels. The first is near the beach.',
  });

  expect(second.segments).toEqual(['The first is near the beach.']);
});

test('does not emit duplicate text for a repeated snapshot', () => {
  const first = collectStreamingSpeech(createStreamingSpeechState(), {
    isComplete: false,
    messageId: 'assistant-1',
    text: 'Hello there.',
  });
  const repeated = collectStreamingSpeech(first.state, {
    isComplete: false,
    messageId: 'assistant-1',
    text: 'Hello there.',
  });

  expect(repeated.segments).toEqual([]);
});

test('flushes an unpunctuated remainder exactly once on completion', () => {
  const partial = collectStreamingSpeech(createStreamingSpeechState(), {
    isComplete: false,
    messageId: 'assistant-1',
    text: 'Here is the final detail',
  });
  const completed = collectStreamingSpeech(partial.state, {
    isComplete: true,
    messageId: 'assistant-1',
    text: 'Here is the final detail',
  });
  const repeated = collectStreamingSpeech(completed.state, {
    isComplete: true,
    messageId: 'assistant-1',
    text: 'Here is the final detail',
  });

  expect(completed.segments).toEqual(['Here is the final detail']);
  expect(repeated.segments).toEqual([]);
});

test('treats a replacement snapshot as a safe baseline instead of replaying it', () => {
  const first = collectStreamingSpeech(createStreamingSpeechState(), {
    isComplete: false,
    messageId: 'assistant-1',
    text: 'Book the first hotel.',
  });
  const replacement = collectStreamingSpeech(first.state, {
    isComplete: false,
    messageId: 'assistant-1',
    text: 'Book the second hotel.',
  });

  expect(replacement.segments).toEqual([]);
});

test('normalizes whitespace and emits newline-delimited segments', () => {
  const update = collectStreamingSpeech(createStreamingSpeechState(), {
    isComplete: false,
    messageId: 'assistant-1',
    text: 'First option\n   Second   option!',
  });

  expect(update.segments).toEqual(['First option', 'Second option!']);
});

test('reset creates an empty turn state', () => {
  const update = collectStreamingSpeech(createStreamingSpeechState(), {
    isComplete: false,
    messageId: 'assistant-1',
    text: 'Already spoken.',
  });

  expect(resetStreamingSpeech()).toEqual(createStreamingSpeechState());
  expect(update.segments).toEqual(['Already spoken.']);
});
