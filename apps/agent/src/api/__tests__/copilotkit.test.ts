import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Hono } from 'hono';

const { CopilotRuntimeMock, createCopilotHonoHandlerMock } = vi.hoisted(() => ({
  CopilotRuntimeMock: vi.fn(),
  createCopilotHonoHandlerMock: vi.fn(() => 'copilot-app'),
}));

vi.mock('@copilotkit/runtime/v2', () => ({
  CopilotRuntime: CopilotRuntimeMock,
  InMemoryAgentRunner: class {},
  createCopilotHonoHandler: createCopilotHonoHandlerMock,
}));

const { searchMock, superGetAssistantMock } = vi.hoisted(() => ({
  searchMock: vi.fn(),
  superGetAssistantMock: vi.fn(),
}));

vi.mock('@copilotkit/runtime/langgraph', () => ({
  LangGraphAgent: class {
    graphId: string;
    client = { assistants: { search: (...args: unknown[]) => searchMock(...args) } };

    constructor(options: { graphId: string }) {
      this.graphId = options.graphId;
    }

    async getAssistant(): Promise<unknown> {
      return superGetAssistantMock();
    }
  },
}));

const createCopilotKitHooksMock = vi.fn((..._args: unknown[]) => 'hooks-object');
vi.mock('../hooks', () => ({
  createCopilotKitHooks: (...args: unknown[]) => createCopilotKitHooksMock(...args),
}));

import { registerCopilotKit } from '../copilotkit';

type FakeTravelAgent = { graphId: string; getAssistant: () => Promise<unknown> };

const registerAndCaptureAgent = (): FakeTravelAgent => {
  const app = { route: vi.fn() } as unknown as Hono;
  registerCopilotKit(app);

  const { agents } = CopilotRuntimeMock.mock.calls[0][0] as {
    agents: { travelAgent: FakeTravelAgent };
  };
  return agents.travelAgent;
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('registerCopilotKit', () => {
  it('mounts the copilot handler at /chat and registers the travel agent with its hooks', () => {
    const app = { route: vi.fn() } as unknown as Hono;

    registerCopilotKit(app);

    expect(createCopilotKitHooksMock).toHaveBeenCalledWith(['travelAgent']);
    expect(createCopilotHonoHandlerMock).toHaveBeenCalledWith(
      expect.objectContaining({ basePath: '/chat', mode: 'single-route', hooks: 'hooks-object' })
    );
    expect(app.route).toHaveBeenCalledWith('/', 'copilot-app');
  });
});

describe('BridgedLangGraphAgent.getAssistant', () => {
  it('resolves the assistant whose graph_id matches, without falling back to the base lookup', async () => {
    const travelAgent = registerAndCaptureAgent();
    const matched = { graph_id: travelAgent.graphId, id: 'matched' };
    searchMock.mockResolvedValueOnce([{ graph_id: 'other-graph' }, matched]);

    const assistant = await travelAgent.getAssistant();

    expect(assistant).toEqual(matched);
    expect(superGetAssistantMock).not.toHaveBeenCalled();
  });

  it('falls back to the base lookup when no assistant matches the graph id', async () => {
    const travelAgent = registerAndCaptureAgent();
    searchMock.mockResolvedValueOnce([{ graph_id: 'other-graph' }]);
    superGetAssistantMock.mockResolvedValueOnce({ id: 'fallback' });

    const assistant = await travelAgent.getAssistant();

    expect(assistant).toEqual({ id: 'fallback' });
  });
});
