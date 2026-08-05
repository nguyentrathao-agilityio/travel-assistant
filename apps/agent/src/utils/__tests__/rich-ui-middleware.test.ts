import { describe, expect, it } from 'vitest';
import { AIMessage, ToolMessage } from '@langchain/core/messages';

import { TOOL_READY_OUTPUT } from '../../constants';
import { richUiModelMiddleware } from '../rich-ui-middleware';

const invokeMiddleware = async (messages: unknown[]) => {
  let captured: { messages: unknown[] } | undefined;
  await richUiModelMiddleware.wrapModelCall!({ messages } as never, async (request) => {
    captured = request as { messages: unknown[] };
    return { output: undefined } as never;
  });
  return captured!.messages as ToolMessage[];
};

describe('richUiModelMiddleware', () => {
  it('collapses a successful rich-card ToolMessage to TOOL_READY_OUTPUT', async () => {
    const original = new ToolMessage({
      content: JSON.stringify({ location: { name: 'Tokyo' } }),
      tool_call_id: 'call_1',
      name: 'weatherTool',
      artifact: { location: { name: 'Tokyo' } },
    });

    const [result] = await invokeMiddleware([original]);

    expect(result.content).toBe(TOOL_READY_OUTPUT);
    expect(result.artifact).toEqual({ location: { name: 'Tokyo' } });
    expect(result.tool_call_id).toBe('call_1');
  });

  it('leaves an error-artifact ToolMessage untouched so the model still sees the failure', async () => {
    const original = new ToolMessage({
      content: JSON.stringify({ error: 'Flight not found: cheapest_flight_id' }),
      tool_call_id: 'call_2',
      name: 'bookFlightTool',
      artifact: { error: 'Flight not found: cheapest_flight_id' },
    });

    const [result] = await invokeMiddleware([original]);

    expect(result).toBe(original);
    expect(result.content).toContain('Flight not found');
    expect(result.content).not.toBe(TOOL_READY_OUTPUT);
  });

  it('leaves non-ToolMessage and artifact-less messages untouched', async () => {
    const plain = new ToolMessage({ content: 'plain result', tool_call_id: 'call_3' });

    const [result] = await invokeMiddleware([plain]);

    expect(result).toBe(plain);
  });

  it('preserves an older rich-card ToolMessage already followed by an AI reaction, so a later agent can still read the real data', async () => {
    const flightsResult = new ToolMessage({
      content: JSON.stringify({ results: [{ id: 'FL_DAD_BKK_20260805_01', price: 89 }] }),
      tool_call_id: 'call_search',
      name: 'flightsTool',
      artifact: { results: [{ id: 'FL_DAD_BKK_20260805_01', price: 89 }] },
    });
    const reaction = new AIMessage({ content: 'Found flights. Want me to book the cheapest one?' });
    const freshCall = new ToolMessage({
      content: JSON.stringify({ error: 'Flight not found' }),
      tool_call_id: 'call_book',
      name: 'bookFlightTool',
      artifact: { error: 'Flight not found' },
    });

    const [resultSearch, resultReaction, resultFresh] = await invokeMiddleware([
      flightsResult,
      reaction,
      freshCall,
    ]);

    expect(resultSearch).toBe(flightsResult);
    expect((resultSearch as ToolMessage).content).toContain('FL_DAD_BKK_20260805_01');
    expect(resultReaction).toBe(reaction);
    expect((resultFresh as ToolMessage).content).toContain('Flight not found');
  });

  it('collapses every ToolMessage in a fresh trailing run (parallel tool calls), not just the last one', async () => {
    const first = new ToolMessage({
      content: JSON.stringify({ a: 1 }),
      tool_call_id: 'call_a',
      name: 'weatherTool',
      artifact: { a: 1 },
    });
    const second = new ToolMessage({
      content: JSON.stringify({ b: 2 }),
      tool_call_id: 'call_b',
      name: 'placesTool',
      artifact: { b: 2 },
    });

    const [resultFirst, resultSecond] = await invokeMiddleware([first, second]);

    expect((resultFirst as ToolMessage).content).toBe(TOOL_READY_OUTPUT);
    expect((resultSecond as ToolMessage).content).toBe(TOOL_READY_OUTPUT);
  });
});
