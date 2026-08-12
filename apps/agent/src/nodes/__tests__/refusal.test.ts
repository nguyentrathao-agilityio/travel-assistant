import { AIMessage, type BaseMessage } from '@langchain/core/messages';
import { describe, expect, it } from 'vitest';

import { refusalNode } from '@/nodes/refusal';
import type { GraphStateType } from '@/state';

const state = (overrides: Partial<GraphStateType> = {}): GraphStateType =>
  ({ messages: [], ...overrides }) as GraphStateType;

describe('refusalNode', () => {
  it('uses the language-matched refusal message classifyNode already produced', () => {
    const update = refusalNode(state({ refusalMessage: 'Tôi chỉ có thể hỗ trợ về du lịch.' }));
    const messages = update.messages as BaseMessage[];

    expect(messages).toHaveLength(1);
    expect(messages[0]).toBeInstanceOf(AIMessage);
    expect(messages[0].content).toBe('Tôi chỉ có thể hỗ trợ về du lịch.');
    expect(update.execution).toMatchObject({
      currentNode: 'refusal',
      completedTasks: ['refusal'],
    });
  });

  it('falls back to a fixed English refusal when refusalMessage is missing, without invoking a model or tool', () => {
    const update = refusalNode(state());
    const messages = update.messages as BaseMessage[];

    expect(messages[0].content).toBe(
      'I can only help with travel planning. Is there a trip I can help you with?'
    );
  });
});
