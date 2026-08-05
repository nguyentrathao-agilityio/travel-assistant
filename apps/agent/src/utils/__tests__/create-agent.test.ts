import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StructuredToolInterface } from '@langchain/core/tools';

const {
  createAgentMock,
  dynamicSystemPromptMiddlewareMock,
  createCopilotkitMiddlewareMock,
  createChatModelMock,
  createDomainStateMiddlewareMock,
} = vi.hoisted(() => ({
  createAgentMock: vi.fn(),
  dynamicSystemPromptMiddlewareMock: vi.fn((fn: unknown) => ({
    __type: 'dynamicSystemPromptMiddleware',
    fn,
  })),
  createCopilotkitMiddlewareMock: vi.fn(() => 'copilotkit-middleware'),
  createChatModelMock: vi.fn(() => 'fake-model'),
  createDomainStateMiddlewareMock: vi.fn(
    (taskName: string) => `domain-state-middleware:${taskName}`
  ),
}));

vi.mock('langchain', () => ({
  createAgent: createAgentMock,
  dynamicSystemPromptMiddleware: dynamicSystemPromptMiddlewareMock,
}));

vi.mock('@copilotkit/sdk-js/langgraph', () => ({
  createCopilotkitMiddleware: createCopilotkitMiddlewareMock,
}));

vi.mock('../../infrastructure/llm', () => ({
  createChatModel: createChatModelMock,
}));

vi.mock('../../infrastructure/persistence', () => ({
  memoryStore: 'fake-memory-store',
}));

const searchMemoriesMock = vi.fn();
vi.mock('../../services/memory', () => ({
  searchMemories: (...args: unknown[]) => searchMemoriesMock(...args),
}));

const buildAgentSystemPromptMock = vi.fn((..._args: unknown[]) => 'system prompt text');
vi.mock('../../prompts', () => ({
  buildAgentSystemPrompt: (...args: unknown[]) => buildAgentSystemPromptMock(...args),
}));

vi.mock('../rich-ui-middleware', () => ({
  richUiModelMiddleware: 'rich-ui-middleware',
}));

vi.mock('../domain-state-middleware', () => ({
  createDomainStateMiddleware: createDomainStateMiddlewareMock,
}));

vi.mock('../../constants', () => ({
  OPENAI_API_KEY: 'test-api-key',
}));

vi.mock('../../state', () => ({
  GraphState: 'fake-graph-state',
}));

import { createSpecializedAgent } from '../create-agent';

const FAKE_GRAPH = { id: 'compiled-graph' };
const tools = ['tool-a', 'tool-b'] as unknown as StructuredToolInterface[];
const sections = { toolsSection: 'Tools available: none.' };

beforeEach(() => {
  createAgentMock.mockReturnValue({ graph: FAKE_GRAPH });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('createSpecializedAgent', () => {
  it('wires the model, tools, state schema, and middleware stack into createAgent', () => {
    const graph = createSpecializedAgent(tools, sections, 'general');

    expect(graph).toBe(FAKE_GRAPH);
    expect(createAgentMock).toHaveBeenCalledTimes(1);

    const call = createAgentMock.mock.calls[0][0];
    expect(call.model).toBe('fake-model');
    expect(call.tools).toBe(tools);
    expect(call.stateSchema).toBe('fake-graph-state');
    expect(call.middleware).toEqual([
      'copilotkit-middleware',
      'rich-ui-middleware',
      'domain-state-middleware:general',
      { __type: 'dynamicSystemPromptMiddleware', fn: expect.any(Function) },
    ]);
  });

  it('includes remembered preferences in the system prompt when includeMemoryContext is set', async () => {
    searchMemoriesMock.mockResolvedValueOnce(['likes window seats']);

    createSpecializedAgent(tools, { ...sections, includeMemoryContext: true }, 'plan');
    const dynamicPromptFn = createAgentMock.mock.calls[0][0].middleware[3].fn;

    const fakeState = { messages: [] };
    await dynamicPromptFn(fakeState);

    expect(searchMemoriesMock).toHaveBeenCalledWith('fake-memory-store');
    expect(buildAgentSystemPromptMock).toHaveBeenCalledWith(
      fakeState,
      { ...sections, includeMemoryContext: true },
      ['likes window seats']
    );
  });

  it('skips memory lookup and passes an empty memories list when includeMemoryContext is not set', async () => {
    createSpecializedAgent(tools, sections, 'general');
    const dynamicPromptFn = createAgentMock.mock.calls[0][0].middleware[3].fn;

    const fakeState = { messages: [] };
    await dynamicPromptFn(fakeState);

    expect(searchMemoriesMock).not.toHaveBeenCalled();
    expect(buildAgentSystemPromptMock).toHaveBeenCalledWith(fakeState, sections, []);
  });
});
