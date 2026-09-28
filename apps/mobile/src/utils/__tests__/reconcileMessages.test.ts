import { reconcileMessages } from '../reconcileMessages';

import type { Message } from '@copilotkit/react-native/headless';

const ids = (messages: Message[]) => messages.map((message) => message.id);

test('replaces archived copies with the newest live copy by stable ID', () => {
  expect(
    reconcileMessages(
      [{ id: 'a1', role: 'assistant', content: 'partial' }],
      [{ id: 'a1', role: 'assistant', content: 'complete' }]
    )
  ).toEqual([{ id: 'a1', role: 'assistant', content: 'complete' }]);
});

test('keeps archive order and appends genuinely new live messages', () => {
  const archived: Message[] = [
    { id: 'u1', role: 'user', content: 'one' },
    { id: 'a1', role: 'assistant', content: 'two' },
  ];
  const live: Message[] = [
    { id: 'a1', role: 'assistant', content: 'two' },
    { id: 'u2', role: 'user', content: 'three' },
  ];

  expect(ids(reconcileMessages(archived, live))).toEqual(['u1', 'a1', 'u2']);
});

test('drops duplicate archived IDs across overlapping pages', () => {
  const archived: Message[] = [
    { id: 'u1', role: 'user', content: 'one' },
    { id: 'u1', role: 'user', content: 'one' },
    { id: 'a1', role: 'assistant', content: 'two' },
  ];

  expect(ids(reconcileMessages(archived, []))).toEqual(['u1', 'a1']);
});

test('renders a tool result once even when live and archived IDs differ', () => {
  const archived: Message[] = [
    { id: 'tool-archived', role: 'tool', toolCallId: 'call-1', content: '{"ok":true}' },
  ];
  const live: Message[] = [
    { id: 'tool-live', role: 'tool', toolCallId: 'call-1', content: '{"ok":true}' },
  ];

  expect(reconcileMessages(archived, live)).toEqual(live);
});

test('keeps assistant replies when the end-of-run snapshot moves the tool result to the end', () => {
  const archived: Message[] = [
    { id: 'u1', role: 'user', content: 'Show me places to visit in Da Nang' },
    { id: 't1', role: 'tool', toolCallId: 'call-1', content: '{"total":8}' },
  ];
  const live: Message[] = [
    { id: 'u1', role: 'user', content: 'Show me places to visit in Da Nang' },
    {
      id: 'a1',
      role: 'assistant',
      toolCalls: [
        { id: 'call-1', type: 'function', function: { name: 'placesTool', arguments: '{}' } },
      ],
    },
    { id: 'a2', role: 'assistant', content: 'There are 8 great places.' },
    { id: 't1', role: 'tool', toolCallId: 'call-1', content: '{"total":8}' },
  ];

  expect(ids(reconcileMessages(archived, live))).toEqual(['u1', 't1', 'a1', 'a2']);
});
