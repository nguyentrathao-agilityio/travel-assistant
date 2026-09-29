import type { StructuredToolInterface } from '@langchain/core/tools';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SUMMARY_MESSAGE_PREFIX } from '@repo/constants';

// Constants
import type { SpecializedAgentConfig } from '@/constants/agent-config';

// Agent
import { createSpecializedAgent } from '@/agent/create-agent';

const {
  createAgentMock,
  dynamicSystemPromptMiddlewareMock,
  humanInTheLoopMiddlewareMock,
  createCopilotkitMiddlewareMock,
  createChatModelMock,
  createDomainStateMiddlewareMock,
  summarizationMiddlewareMock,
  openAIModerationMiddlewareMock,
  createObservabilityMiddlewareMock,
  modelFallbackMiddlewareMock,
  modelRetryMiddlewareMock,
  toolCallLimitMiddlewareMock,
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
  summarizationMiddlewareMock: vi.fn(() => 'summarization-middleware'),
  openAIModerationMiddlewareMock: vi.fn(() => 'moderation-middleware'),
  createObservabilityMiddlewareMock: vi.fn(
    (taskName: string) => `observability-middleware:${taskName}`
  ),
  modelFallbackMiddlewareMock: vi.fn(() => 'model-fallback-middleware'),
  modelRetryMiddlewareMock: vi.fn(() => 'model-retry-middleware'),
  toolCallLimitMiddlewareMock: vi.fn(() => 'tool-call-limit-middleware'),
}));

vi.mock('langchain', () => ({
  createAgent: createAgentMock,
  dynamicSystemPromptMiddleware: dynamicSystemPromptMiddlewareMock,
  humanInTheLoopMiddleware: humanInTheLoopMiddlewareMock,
  summarizationMiddleware: summarizationMiddlewareMock,
  openAIModerationMiddleware: openAIModerationMiddlewareMock,
  modelFallbackMiddleware: modelFallbackMiddlewareMock,
  modelRetryMiddleware: modelRetryMiddlewareMock,
  toolCallLimitMiddleware: toolCallLimitMiddlewareMock,
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

vi.mock('@/agent/middleware/domain-state', () => ({
  createDomainStateMiddleware: createDomainStateMiddlewareMock,
}));

vi.mock('@/agent/middleware/rich-ui', () => ({
  richUiModelMiddleware: 'rich-ui-middleware',
}));

vi.mock('@/agent/middleware/tool-message-order', () => ({
  toolMessageOrderMiddleware: 'tool-message-order-middleware',
}));

vi.mock('@/agent/middleware/observability', () => ({
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
    expect(createChatModelMock).toHaveBeenCalledWith({ apiKey: 'sk-request', model: 'gpt-4o' });
    expect(call.tools).toBe(tools);
    expect(call.stateSchema).toBe('fake-graph-state');
    expect(call.middleware).toEqual([
      'copilotkit-middleware',
      'summarization-middleware',
      'moderation-middleware',
      'domain-state-middleware:general',
      'tool-call-limit-middleware',
      'observability-middleware:general',
      'tool-message-order-middleware',
      'rich-ui-middleware',
      { __type: 'dynamicSystemPromptMiddleware', fn: expect.any(Function) },
      'model-fallback-middleware',
      'model-retry-middleware',
    ]);
    expect(modelFallbackMiddlewareMock).toHaveBeenCalledWith('fake-model');
    expect(modelRetryMiddlewareMock).toHaveBeenCalledWith({ maxRetries: 1, onFailure: 'error' });
    expect(toolCallLimitMiddlewareMock).toHaveBeenCalledWith({
      runLimit: 15,
      exitBehavior: 'end',
    });
    expect(summarizationMiddlewareMock).toHaveBeenCalledWith({
      model: 'fake-model',
      trigger: [{ fraction: 0.75 }, { messages: 20 }],
      keep: { messages: 10 },
      summaryPrefix: SUMMARY_MESSAGE_PREFIX,
    });
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
    const dynamicPromptFn = createAgentMock.mock.calls[0][0].middleware.find(
      (entry: { __type?: string }) => entry?.__type === 'dynamicSystemPromptMiddleware'
    ).fn;

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
        bookFlightTool: { allowedDecisions: ['approve', 'edit', 'reject'] },
        bookHotelTool: { allowedDecisions: ['approve', 'edit', 'reject'] },
        cancelBookingTool: { allowedDecisions: ['approve', 'reject'] },
      },
    });
    expect(createAgentMock.mock.calls[0][0].middleware).toContainEqual({
      __type: 'hitl',
      options: {
        interruptOn: {
          bookFlightTool: { allowedDecisions: ['approve', 'edit', 'reject'] },
          bookHotelTool: { allowedDecisions: ['approve', 'edit', 'reject'] },
          cancelBookingTool: { allowedDecisions: ['approve', 'reject'] },
        },
      },
    });
    expect(createAgentMock.mock.calls[0][0].checkpointer).toBe(true);
  });

  it('runs the active-booking guard before requesting approval for a booking tool', () => {
    createSpecializedAgent(
      config({
        name: 'booking',
        approvalTools: ['bookFlightTool'],
      }),
      'sk-request'
    );

    const middleware = createAgentMock.mock.calls[0][0].middleware;
    const guardIndex = middleware.indexOf('domain-state-middleware:booking');
    const approvalIndex = middleware.findIndex(
      (entry: { __type?: string }) => entry.__type === 'hitl'
    );

    expect(guardIndex).toBeLessThan(approvalIndex);
  });

  it('skips memory lookup and passes an empty memories list when includeMemoryContext is not set', async () => {
    createSpecializedAgent(config(), 'sk-request');
    const dynamicPromptFn = createAgentMock.mock.calls[0][0].middleware.find(
      (entry: { __type?: string }) => entry?.__type === 'dynamicSystemPromptMiddleware'
    ).fn;

    const fakeState = { messages: [] };

    await dynamicPromptFn(fakeState);

    expect(searchMemoriesMock).not.toHaveBeenCalled();
    expect(buildAgentSystemPromptMock).toHaveBeenCalledWith(fakeState, sections, []);
  });
});
