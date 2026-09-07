import assert from 'node:assert/strict';
import test from 'node:test';

import { findToolMessage, renderableMessages } from './chatMessages';

import type { Message } from '@copilotkit/react-native/headless';

test('renderableMessages keeps only user and assistant turns', () => {
  const messages = [
    { id: '1', role: 'system', content: 'ignored' },
    { id: '2', role: 'user', content: 'Plan a trip to Hue' },
    { id: '3', role: 'assistant', content: 'Sure!' },
    { id: '4', role: 'tool', content: '{}', toolCallId: 'call-1' },
  ] as unknown as Message[];

  const result = renderableMessages(messages);

  assert.deepEqual(
    result.map((message) => message.id),
    ['2', '3']
  );
});

test('findToolMessage locates the tool result matching a tool call id', () => {
  const messages = [
    { id: '1', role: 'assistant', content: '', toolCalls: [{ id: 'call-1' }] },
    { id: '2', role: 'tool', content: 'sunny', toolCallId: 'call-1' },
    { id: '3', role: 'tool', content: 'rainy', toolCallId: 'call-2' },
  ] as unknown as Message[];

  assert.equal(findToolMessage(messages, 'call-1')?.content, 'sunny');
  assert.equal(findToolMessage(messages, 'call-2')?.content, 'rainy');
  assert.equal(findToolMessage(messages, 'call-3'), undefined);
});
