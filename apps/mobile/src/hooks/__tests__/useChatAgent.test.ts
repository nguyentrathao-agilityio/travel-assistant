import { act, renderHook, waitFor } from '@testing-library/react-native';

import { AGENT_NAME } from '@repo/constants';

import { STOP_GENERATION_RETRY_DELAY_MS } from '../../constants';
import { useChatAgent } from '../useChatAgent';

jest.mock('@copilotkit/react-native/headless', () => ({
  UseAgentUpdate: {
    OnMessagesChanged: 'onMessagesChanged',
    OnRunStatusChanged: 'onRunStatusChanged',
  },
  useAgent: jest.fn(),
  useCopilotKit: jest.fn(),
}));

jest.mock('../../services', () => ({
  generateThreadId: jest.fn(),
}));

import { useAgent, useCopilotKit } from '@copilotkit/react-native/headless';

import { generateThreadId } from '../../services';

const makeAgent = () => ({
  threadId: '',
  messages: [] as unknown[],
  isRunning: false,
  addMessage: jest.fn(),
  abortRun: jest.fn(),
});

const setup = (agent = makeAgent()) => {
  const subscription = { unsubscribe: jest.fn() };
  const copilotkit = {
    subscribe: jest.fn().mockReturnValue(subscription),
    runAgent: jest.fn().mockResolvedValue(undefined),
  };

  (useAgent as jest.Mock).mockReturnValue({ agent, isReady: true });
  (useCopilotKit as jest.Mock).mockReturnValue({ copilotkit });

  return { agent, copilotkit, subscription };
};

beforeEach(() => {
  jest.clearAllMocks();
  (generateThreadId as jest.Mock).mockReturnValue('generated-id');
});

test('exposes messages, isRunning and isReady from the underlying agent', async () => {
  const agent = makeAgent();
  agent.messages = [{ id: '1', role: 'user', content: 'hi' }];
  agent.isRunning = true;
  setup(agent);

  const { result } = await renderHook(() => useChatAgent('thread-1'));

  expect(result.current.messages).toBe(agent.messages);
  expect(result.current.isRunning).toBe(true);
  expect(result.current.isReady).toBe(true);
  expect(result.current.error).toBeNull();
});

test('syncs the agent threadId to the hook argument', async () => {
  const agent = makeAgent();
  setup(agent);

  await renderHook(() => useChatAgent('thread-42'));

  expect(agent.threadId).toBe('thread-42');
});

test('sendMessage ignores blank input', async () => {
  const agent = makeAgent();
  const { copilotkit } = setup(agent);

  const { result } = await renderHook(() => useChatAgent('thread-1'));

  await act(async () => {
    await result.current.sendMessage('   ');
  });

  expect(agent.addMessage).not.toHaveBeenCalled();
  expect(copilotkit.runAgent).not.toHaveBeenCalled();
});

test('sendMessage ignores input while the agent is already running', async () => {
  const agent = makeAgent();
  agent.isRunning = true;
  const { copilotkit } = setup(agent);

  const { result } = await renderHook(() => useChatAgent('thread-1'));

  await act(async () => {
    await result.current.sendMessage('another message');
  });

  expect(agent.addMessage).not.toHaveBeenCalled();
  expect(copilotkit.runAgent).not.toHaveBeenCalled();
});

test('sendMessage adds a trimmed user message and runs the agent', async () => {
  const agent = makeAgent();
  const { copilotkit } = setup(agent);

  const { result } = await renderHook(() => useChatAgent('thread-1'));

  await act(async () => {
    await result.current.sendMessage('  hello there  ');
  });

  expect(agent.addMessage).toHaveBeenCalledWith({
    id: 'generated-id',
    role: 'user',
    content: 'hello there',
  });
  expect(copilotkit.runAgent).toHaveBeenCalledWith({ agent });
});

test('sendMessage surfaces an error message when runAgent rejects', async () => {
  const agent = makeAgent();
  const { copilotkit } = setup(agent);

  copilotkit.runAgent.mockRejectedValueOnce(new Error('boom'));

  const { result } = await renderHook(() => useChatAgent('thread-1'));

  await act(async () => {
    await result.current.sendMessage('hello');
  });

  await waitFor(() => {
    expect(result.current.error).toBe('boom');
  });
});

test('sendMessage falls back to a generic error for a non-Error rejection', async () => {
  const agent = makeAgent();
  const { copilotkit } = setup(agent);

  copilotkit.runAgent.mockRejectedValueOnce('failure string');

  const { result } = await renderHook(() => useChatAgent('thread-1'));

  await act(async () => {
    await result.current.sendMessage('hello');
  });

  await waitFor(() => {
    expect(result.current.error).toBe('Something went wrong. Please try again.');
  });
});

// Stubs setTimeout so `stop()`'s retry never becomes a real pending timer — only its
// scheduling and callback logic are exercised, invoked directly.
const stubSetTimeout = () =>
  jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
    (fn as () => void)();
    return 0 as unknown as ReturnType<typeof setTimeout>;
  });

test('stop aborts the current run', async () => {
  const agent = makeAgent();
  setup(agent);

  const { result } = await renderHook(() => useChatAgent('thread-1'));
  const setTimeoutSpy = stubSetTimeout();

  await act(async () => {
    result.current.stop();
  });

  expect(agent.abortRun).toHaveBeenCalledTimes(1);
  setTimeoutSpy.mockRestore();
});

test('stop retries once if the run is still active after the retry delay', async () => {
  const agent = makeAgent();
  agent.isRunning = true;
  setup(agent);

  const { result } = await renderHook(() => useChatAgent('thread-1'));
  const setTimeoutSpy = stubSetTimeout();

  await act(async () => {
    result.current.stop();
  });

  expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), STOP_GENERATION_RETRY_DELAY_MS);
  expect(agent.abortRun).toHaveBeenCalledTimes(2);
  setTimeoutSpy.mockRestore();
});

test('stop does not retry once the run has already stopped', async () => {
  const agent = makeAgent();
  agent.isRunning = false;
  setup(agent);

  const { result } = await renderHook(() => useChatAgent('thread-1'));
  const setTimeoutSpy = stubSetTimeout();

  await act(async () => {
    result.current.stop();
  });

  expect(agent.abortRun).toHaveBeenCalledTimes(1);
  setTimeoutSpy.mockRestore();
});

test('sets an error when the subscription reports one for this agent', async () => {
  const agent = makeAgent();
  const { copilotkit } = setup(agent);

  const { result } = await renderHook(() => useChatAgent('thread-1'));

  const { onError } = copilotkit.subscribe.mock.calls[0][0];

  await act(async () => {
    onError({ error: { message: 'agent exploded' }, context: { agentId: AGENT_NAME } });
  });

  expect(result.current.error).toBe('agent exploded');
});

test('ignores subscription errors reported for a different agent', async () => {
  const agent = makeAgent();
  const { copilotkit } = setup(agent);

  const { result } = await renderHook(() => useChatAgent('thread-1'));

  const { onError } = copilotkit.subscribe.mock.calls[0][0];

  await act(async () => {
    onError({ error: { message: 'unrelated' }, context: { agentId: 'someOtherAgent' } });
  });

  expect(result.current.error).toBeNull();
});

test('unsubscribes from the copilotkit subscription on unmount', async () => {
  const agent = makeAgent();
  const { subscription } = setup(agent);

  const { unmount } = await renderHook(() => useChatAgent('thread-1'));

  await unmount();

  expect(subscription.unsubscribe).toHaveBeenCalledTimes(1);
});
