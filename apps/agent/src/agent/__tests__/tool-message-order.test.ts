import { AIMessage, AIMessageChunk, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { describe, expect, it, vi } from 'vitest';

import {
  normalizeToolMessageOrder,
  toolMessageOrderMiddleware,
} from '../middleware/tool-message-order';

import type { BaseMessage } from '@langchain/core/messages';

const human = (id: string) => new HumanMessage({ id, content: id });
const toolCall = (id: string) => ({
  id,
  name: 'placesTool',
  args: {},
  type: 'tool_call' as const,
});
const assistantWithCalls = (id: string, ...callIds: string[]) =>
  new AIMessage({ id, content: '', tool_calls: callIds.map(toolCall) });
const assistantText = (id: string) => new AIMessage({ id, content: `text ${id}` });
const tool = (id: string, callId: string) =>
  new ToolMessage({ id, content: '{}', tool_call_id: callId, name: 'placesTool' });

const shape = (messages: BaseMessage[]) =>
  messages.map((message) => {
    const calls = (message as AIMessage).tool_calls?.map((call) => call.id) ?? [];
    return `${message.getType()}:${message.id}${calls.length ? `(${calls.join(',')})` : ''}`;
  });

describe('normalizeToolMessageOrder', () => {
  it('moves a tool result streamed after the assistant text back behind its tool call', () => {
    const messages = [
      human('u1'),
      assistantWithCalls('a1', 'call-1'),
      assistantText('a2'),
      tool('t1', 'call-1'),
      human('suggest'),
    ];

    expect(shape(normalizeToolMessageOrder(messages))).toEqual([
      'human:u1',
      'ai:a1(call-1)',
      'tool:t1',
      'ai:a2',
      'human:suggest',
    ]);
  });

  it('handles streamed assistant chunks the same way', () => {
    const chunk = new AIMessageChunk({ id: 'a1', content: '', tool_calls: [toolCall('call-1')] });

    expect(
      shape(normalizeToolMessageOrder([chunk, assistantText('a2'), tool('t1', 'call-1')]))
    ).toEqual(['ai:a1(call-1)', 'tool:t1', 'ai:a2']);
  });

  it('keeps parallel tool results in tool-call order', () => {
    const messages = [
      assistantWithCalls('a1', 'call-1', 'call-2'),
      tool('t2', 'call-2'),
      tool('t1', 'call-1'),
    ];

    expect(shape(normalizeToolMessageOrder(messages))).toEqual([
      'ai:a1(call-1,call-2)',
      'tool:t1',
      'tool:t2',
    ]);
  });

  it('returns well-ordered history unchanged', () => {
    const messages = [
      human('u1'),
      assistantWithCalls('a1', 'call-1'),
      tool('t1', 'call-1'),
      assistantText('a2'),
    ];
    const normalized = normalizeToolMessageOrder(messages);

    normalized.forEach((message, index) => expect(message).toBe(messages[index]));
  });

  it('drops tool calls that never received a result', () => {
    const dangling = new AIMessage({
      id: 'a1',
      content: 'Checking',
      tool_calls: [toolCall('call-1'), toolCall('call-2')],
      additional_kwargs: { tool_calls: [] },
    });
    const normalized = normalizeToolMessageOrder([dangling, tool('t1', 'call-1')]);

    expect(shape(normalized)).toEqual(['ai:a1(call-1)', 'tool:t1']);
    expect((normalized[0] as AIMessage).additional_kwargs.tool_calls).toBeUndefined();
  });

  it('drops an empty assistant message whose only tool calls are unanswered', () => {
    expect(
      shape(normalizeToolMessageOrder([human('u1'), assistantWithCalls('a1', 'call-1')]))
    ).toEqual(['human:u1']);
  });

  it('drops tool results that have no matching tool call', () => {
    expect(
      shape(normalizeToolMessageOrder([human('u1'), tool('t1', 'call-x'), assistantText('a1')]))
    ).toEqual(['human:u1', 'ai:a1']);
  });
});

describe('toolMessageOrderMiddleware', () => {
  it('sends normalized messages to the model', async () => {
    const handler = vi.fn().mockResolvedValue(new AIMessage('ok'));
    const request = {
      messages: [assistantWithCalls('a1', 'call-1'), assistantText('a2'), tool('t1', 'call-1')],
    };

    await toolMessageOrderMiddleware.wrapModelCall!(request as never, handler);

    expect(shape(handler.mock.calls[0][0].messages)).toEqual(['ai:a1(call-1)', 'tool:t1', 'ai:a2']);
  });
});
