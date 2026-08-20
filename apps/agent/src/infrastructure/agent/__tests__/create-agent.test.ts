import type { StructuredToolInterface } from '@langchain/core/tools';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Constants
import type { SpecializedAgentConfig } from '@/constants/agent-config';

// Infrastructure
import { createSpecializedAgent } from '@/infrastructure/agent/create-agent';

const {
  createAgentMock,
  dynamicSystemPromptMiddlewareMock,
  humanInTheLoopMiddlewareMock,
  createCopilotkitMiddlewareMock,
  createChatModelMock,
  createDomainStateMiddlewareMock,
  openAIModerationMiddlewareMock,
  createObservabilityMiddlewareMock,
} = vi.hoisted(() => ({
  createAgentMock: vi.fn(),
  dynamicSystemPromptMiddlewareMock: vi.fn((fn: unknown) => ({
    __type: 'dynamicSystemPromptMiddleware',
    fn,
  })),
  humanInTheLoopMiddlewareMock: vi.fn((options: unknown) => ({ __type: 'hitl', options })),
  createCopilotkitMiddlewareMock: vi.fn(() => 'copilotkit-middleware'),
  createChatModelMock: vi.fn(() => 'fake-model'),
  createDomainStateMiddlewareMock: vi.fn(
    (taskName: string) => `domain-state-middleware:${taskName}`
  ),
  openAIModerationMiddlewareMock: vi.fn(() => 'moderation-middleware'),
  createObservabilityMiddlewareMock: vi.fn(
    (taskName: string) => `observability-middleware:${taskName}`
  ),
}));

vi.mock('langchain', () => ({
  createAgent: createAgentMock,
  dynamicSystemPromptMiddleware: dynamicSystemPromptMiddlewareMock,
  humanInTheLoopMiddleware: humanInTheLoopMiddlewareMock,
  openAIModerationMiddleware: openAIModerationMiddlewareMock,
}));

vi.mock('@copilotkit/sdk-js/langgraph', () => ({
  createCopilotkitMiddleware: createCopilotkitMiddlewareMock,
}));

vi.mock('@/infrastructure/llm', () => ({
  createChatModel: createChatModelMock,
}));

vi.mock('@/infrastructure/persistence', () => ({
  memoryStore: 'fake-memory-store',
}));

const searchMemoriesMock = vi.fn();

vi.mock('@/services/memory', () => ({
  searchMemories: (...args: unknown[]) => searchMemoriesMock(...args),
}));

const buildAgentSystemPromptMock = vi.fn((..._args: unknown[]) => 'system prompt text');

vi.mock('@/prompts', () => ({
  buildAgentSystemPrompt: (...args: unknown[]) => buildAgentSystemPromptMock(...args),
}));

vi.mock('@/utils/domain-state', () => ({
  createDomainStateMiddleware: createDomainStateMiddlewareMock,
}));

vi.mock('@/utils/rich-ui', () => ({
  richUiModelMiddleware: 'rich-ui-middleware',
}));

vi.mock('@/infrastructure/agent/observability', () => ({
  createObservabilityMiddleware: createObservabilityMiddlewareMock,
}));

vi.mock('@/state', () => ({
  GraphState: 'fake-graph-state',
}));

const FAKE_GRAPH = { id: 'compiled-graph' };
const tools = ['tool-a', 'tool-b'] as unknown as StructuredToolInterface[];
const sections = { toolsSection: 'Tools available: none.' };
const config = (overrides: Partial<SpecializedAgentConfig> = {}): SpecializedAgentConfig => ({
  name: 'general',
  tools,
  prompt: sections,
  ...overrides,
});

beforeEach(() => {
  createAgentMock.mockReturnValue({ graph: FAKE_GRAPH });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('createSpecializedAgent', () => {
  it('wires the model, tools, state schema, and middleware stack into createAgent', () => {
    const graph = createSpecializedAgent(config(), 'sk-request');

    expect(graph).toBe(FAKE_GRAPH);
    expect(createAgentMock).toHaveBeenCalledTimes(1);

    const call = createAgentMock.mock.calls[0][0];

    expect(call.model).toBe('fake-model');
    expect(createChatModelMock).toHaveBeenCalledWith({ apiKey: 'sk-request' });
    expect(call.tools).toBe(tools);
    expect(call.stateSchema).toBe('fake-graph-state');
    expect(call.middleware).toEqual([
      'copilotkit-middleware',
      'moderation-middleware',
      'observability-middleware:general',
      'rich-ui-middleware',
      'domain-state-middleware:general',
      { __type: 'dynamicSystemPromptMiddleware', fn: expect.any(Function) },
    ]);
    expect(openAIModerationMiddlewareMock).toHaveBeenCalledWith({
      model: 'fake-model',
      moderationModel: 'omni-moderation-latest',
      checkInput: true,
      checkOutput: true,
      checkToolResults: false,
      exitBehavior: 'end',
      violationMessage: "I can't help with that request.",
    });
  });

  it('includes remembered preferences in the system prompt when includeMemoryContext is set', async () => {
    searchMemoriesMock.mockResolvedValueOnce(['likes window seats']);

    createSpecializedAgent(
      config({ name: 'plan', prompt: { ...sections, includeMemoryContext: true } }),
      'sk-request'
    );
    const dynamicPromptFn = createAgentMock.mock.calls[0][0].middleware[5].fn;

    const fakeState = { messages: [] };

    await dynamicPromptFn(fakeState);

    expect(searchMemoriesMock).toHaveBeenCalledWith('fake-memory-store');
    expect(buildAgentSystemPromptMock).toHaveBeenCalledWith(
      fakeState,
      { ...sections, includeMemoryContext: true },
      ['likes window seats']
    );
  });

  it('adds HITL middleware before a configured write tool executes', () => {
    createSpecializedAgent(
      config({
        name: 'booking',
        approvalTools: ['bookFlightTool', 'bookHotelTool', 'cancelBookingTool'],
      }),
      'sk-request'
    );

    expect(humanInTheLoopMiddlewareMock).toHaveBeenCalledWith({
      interruptOn: {
        bookFlightTool: { allowedDecisions: ['approve', 'reject'] },
        bookHotelTool: { allowedDecisions: ['approve', 'reject'] },
        cancelBookingTool: { allowedDecisions: ['approve', 'reject'] },
      },
    });
    expect(createAgentMock.mock.calls[0][0].middleware).toContainEqual({
      __type: 'hitl',
      options: {
        interruptOn: {
          bookFlightTool: { allowedDecisions: ['approve', 'reject'] },
          bookHotelTool: { allowedDecisions: ['approve', 'reject'] },
          cancelBookingTool: { allowedDecisions: ['approve', 'reject'] },
        },
      },
    });
    expect(createAgentMock.mock.calls[0][0].checkpointer).toBe(true);
  });

  it('skips memory lookup and passes an empty memories list when includeMemoryContext is not set', async () => {
    createSpecializedAgent(config(), 'sk-request');
    const dynamicPromptFn = createAgentMock.mock.calls[0][0].middleware[5].fn;

    const fakeState = { messages: [] };

    await dynamicPromptFn(fakeState);

    expect(searchMemoriesMock).not.toHaveBeenCalled();
    expect(buildAgentSystemPromptMock).toHaveBeenCalledWith(fakeState, sections, []);
  });
});
