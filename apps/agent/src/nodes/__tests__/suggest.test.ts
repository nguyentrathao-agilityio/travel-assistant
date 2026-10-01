import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { describe, expect, it, vi } from 'vitest';

// Nodes
import { isSuggestionRequest, routeFromStart, suggestNode } from '@/nodes/suggest';

// State
import type { GraphStateType } from '@/state';

const { bindToolsMock, createChatModelMock, invokeMock } = vi.hoisted(() => {
  const invoke = vi.fn();
  const bindTools = vi.fn(() => ({ invoke }));

  return {
    invokeMock: invoke,
    bindToolsMock: bindTools,
    createChatModelMock: vi.fn(() => ({ bindTools })),
  };
});

vi.mock('@/infrastructure/llm', () => ({
  openAiApiKeyFromConfig: vi.fn(() => 'sk-request'),
  createChatModel: createChatModelMock,
}));

const SUGGEST_PARAMETERS = {
  type: 'object',
  properties: { suggestions: { type: 'array' } },
  required: ['suggestions'],
};

const suggestAction = {
  name: 'copilotkitSuggest',
  description: 'Suggest what the user could say next',
  parameters: SUGGEST_PARAMETERS,
};

const state = (overrides: Partial<GraphStateType> = {}): GraphStateType =>
  ({ messages: [], ...overrides }) as GraphStateType;

const withActions = (actions: unknown[], messages: GraphStateType['messages'] = []) =>
  ({ messages, copilotkit: { actions, context: [] } }) as unknown as GraphStateType;

describe('isSuggestionRequest', () => {
  it('detects the CopilotKit suggestion tool in AG-UI shape', () => {
    expect(isSuggestionRequest(withActions([suggestAction]))).toBe(true);
  });

  it('detects the CopilotKit suggestion tool in OpenAI function shape', () => {
    const openAiShape = { type: 'function', function: suggestAction };

    expect(isSuggestionRequest(withActions([openAiShape]))).toBe(true);
  });

  it('ignores normal runs that only expose other frontend tools', () => {
    expect(isSuggestionRequest(withActions([{ name: 'setTheme', parameters: {} }]))).toBe(false);
    expect(isSuggestionRequest(state())).toBe(false);
  });
});

describe('routeFromStart', () => {
  it('sends suggestion runs straight to the suggest node', () => {
    expect(routeFromStart(withActions([suggestAction]))).toBe('suggest');
  });

  it('sends every other run to classify', () => {
    expect(routeFromStart(state())).toBe('classify');
  });
});

describe('suggestNode', () => {
  it('forces a single copilotkitSuggest call over a text-only view of the conversation', async () => {
    const response = new AIMessage({
      content: '',
      tool_calls: [{ id: 'call-1', name: 'copilotkitSuggest', args: { suggestions: [] } }],
    });
    invokeMock.mockResolvedValueOnce(response);

    const instruction = 'Suggest what the user could say next by calling copilotkitSuggest.';
    const result = await suggestNode(
      withActions(
        [suggestAction],
        [
          new HumanMessage('Weather in Hanoi?'),
          new AIMessage({
            content: '',
            tool_calls: [{ id: 'weather-1', name: 'weatherTool', args: { city: 'Hanoi' } }],
          }),
          new ToolMessage({ content: '{"temp":34}', tool_call_id: 'weather-1' }),
          new AIMessage('It is 34°C in Hanoi.'),
          new HumanMessage(instruction),
        ]
      )
    );

    expect(bindToolsMock).toHaveBeenCalledWith(
      [
        {
          type: 'function',
          function: {
            name: 'copilotkitSuggest',
            description: suggestAction.description,
            parameters: SUGGEST_PARAMETERS,
          },
        },
      ],
      { tool_choice: { type: 'function', function: { name: 'copilotkitSuggest' } } }
    );

    const [[sentMessages]] = invokeMock.mock.calls;

    expect(sentMessages[0]).toBeInstanceOf(SystemMessage);
    expect(sentMessages).toHaveLength(2);
    expect(sentMessages[1]).toBeInstanceOf(HumanMessage);
    expect(sentMessages[1].content).toContain('User: Weather in Hanoi?');
    expect(sentMessages[1].content).toContain('Assistant: It is 34°C in Hanoi.');
    expect(sentMessages[1].content).toContain(instruction);
    expect(sentMessages[1].content).not.toContain('{"temp":34}');
    expect(result).toEqual({ messages: [response] });
  });
});
