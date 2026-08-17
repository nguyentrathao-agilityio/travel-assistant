jest.mock('@copilotkit/react-ui', () => ({
  useChatContext: jest.fn(() => ({ icons: {} })),
  CopilotChat: jest.fn(() => null),
}));

jest.mock('@copilotkit/react-core', () => ({
  useCopilotChatInternal: jest.fn(() => ({
    sendMessage: jest.fn(),
    messages: [],
    setMessages: jest.fn(),
    isAvailable: true,
    interrupt: null,
  })),
  useRenderToolCall: jest.fn(),
  useLazyToolRenderer: jest.fn(() => jest.fn(() => null)),
  useHumanInTheLoop: jest.fn(),
  useLangGraphInterrupt: jest.fn(),
  useCoAgent: jest.fn(() => ({ state: {} })),
  CopilotKit: jest.fn(({ children }: { children: React.ReactNode }) => children),
}));

jest.mock('@copilotkit/react-core/v2', () => ({
  useAgent: jest.fn(() => ({
    agent: { messages: [], setMessages: jest.fn() },
  })),
  useCopilotKit: jest.fn(() => ({
    copilotkit: {
      interruptElement: null,
      subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
    },
  })),
  useAgentContext: jest.fn(),
  useFrontendTool: jest.fn(),
  useRenderTool: jest.fn(),
}));

jest.mock('@/lib/langgraphClient', () => ({
  langgraphClient: {
    threads: {
      search: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      getState: jest.fn(),
    },
  },
}));

jest.mock('@/constants/agent', () => ({
  RUNTIME_URL: 'http://localhost',
  COPILOTKIT_PUBLIC_LICENSE_KEY: 'test-key',
  AGENT_NAME: 'travelAgent',
  FETCH_THREADS_DELAY_MS: 0,
  FETCH_TITLE_DELAY_MS: 0,
  FETCH_TITLE_RETRY_MS: 0,
  CHAT_ROLE: { USER: 'user', ASSISTANT: 'assistant', TOOL: 'tool' },
  ALLOWED_CHAT_ROLES: ['user', 'assistant', 'tool'],
  COAGENT_STATE_RENDER_MESSAGE_NAME: 'coagent-state-render',
  ASSISTANT_MESSAGE_FAILED_TERMS: [],
}));

// jsdom does not provide fetch — mock globally so components that call fetch on mount don't crash
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({ files: [] }),
});
