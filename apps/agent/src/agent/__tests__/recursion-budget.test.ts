import { HumanMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { GraphRecursionError } from '@langchain/langgraph';
import { z } from 'zod';
import { createAgent, createMiddleware, FakeToolCallingModel } from 'langchain';
import { describe, expect, it, vi } from 'vitest';

import { SPECIALIZED_AGENT_RECURSION_LIMIT, TOOL_CALL_RUN_LIMIT } from '@/constants';
import { createToolCallLimitMiddleware } from '@/agent/middleware/tool-call-limit';

const nodeMiddleware = (
  name: string,
  hook: 'beforeAgent' | 'beforeModel' | 'afterModel' | 'afterAgent'
) => createMiddleware({ name, [hook]: () => undefined });

const topologyMiddleware = (includeLegacyTranscript: boolean) => [
  nodeMiddleware('CopilotKit', 'beforeAgent'),
  nodeMiddleware('Summarization', 'beforeModel'),
  nodeMiddleware('ModerationInput', 'beforeModel'),
  nodeMiddleware('StatePreparation', 'beforeModel'),
  nodeMiddleware('ModerationOutput', 'afterModel'),
  createToolCallLimitMiddleware(),
  nodeMiddleware('PersistDomainState', 'afterAgent'),
  nodeMiddleware('CopilotKitCleanup', 'afterAgent'),
  ...(includeLegacyTranscript ? [nodeMiddleware('LegacyTranscriptPersistence', 'afterAgent')] : []),
];

const createTwoToolAgent = (includeLegacyTranscript: boolean) => {
  const weather = vi.fn(async () => 'sunny');
  const hotel = vi.fn(async () => 'hotel result');
  const weatherTool = tool(weather, {
    name: 'weatherTool',
    description: 'Weather',
    schema: z.object({ city: z.string() }),
  });
  const hotelTool = tool(hotel, {
    name: 'hotelTool',
    description: 'Hotels',
    schema: z.object({ city: z.string() }),
  });
  const model = new FakeToolCallingModel({
    toolCalls: [
      [{ id: 'weather-1', name: 'weatherTool', args: { city: 'Ho Chi Minh City' } }],
      [{ id: 'hotel-1', name: 'hotelTool', args: { city: 'Ho Chi Minh City' } }],
      [],
    ],
  });
  const graph = createAgent({
    model,
    tools: [weatherTool, hotelTool],
    middleware: topologyMiddleware(includeLegacyTranscript),
  }).graph;

  return { graph, hotel, weather };
};

describe('specialized agent recursion budget', () => {
  it('reproduces the legacy two-tool recursion failure at the default budget', async () => {
    const { graph } = createTwoToolAgent(true);

    await expect(
      graph.invoke(
        { messages: [new HumanMessage('Check weather, then find a hotel')] },
        { recursionLimit: 25 }
      )
    ).rejects.toBeInstanceOf(GraphRecursionError);
  });

  it('completes the current two-tool topology within the configured budget', async () => {
    const { graph, hotel, weather } = createTwoToolAgent(false);

    const result = await graph.invoke(
      { messages: [new HumanMessage('Check weather, then find a hotel')] },
      { recursionLimit: SPECIALIZED_AGENT_RECURSION_LIMIT }
    );

    expect(result.messages.at(-1)?.content).toContain('hotel result');
    expect(weather).toHaveBeenCalledTimes(1);
    expect(hotel).toHaveBeenCalledTimes(1);
  });

  it('hard-stops a runaway tool loop before recursion exhaustion', async () => {
    const execute = vi.fn(async () => 'again');
    const repeatTool = tool(execute, {
      name: 'repeatTool',
      description: 'Repeats',
      schema: z.object({}),
    });
    const repeatedCalls = Array.from({ length: TOOL_CALL_RUN_LIMIT + 2 }, (_, index) => [
      { id: `repeat-${index}`, name: 'repeatTool', args: {} },
    ]);
    const graph = createAgent({
      model: new FakeToolCallingModel({ toolCalls: repeatedCalls }),
      tools: [repeatTool],
      middleware: topologyMiddleware(false),
    }).graph;

    await expect(
      graph.invoke(
        { messages: [new HumanMessage('Keep calling the tool')] },
        { recursionLimit: SPECIALIZED_AGENT_RECURSION_LIMIT }
      )
    ).resolves.toBeDefined();
    expect(execute).toHaveBeenCalledTimes(TOOL_CALL_RUN_LIMIT);
  });
});
