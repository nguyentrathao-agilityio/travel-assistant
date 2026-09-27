import { renderHook } from '@testing-library/react-native';

import { TOOL_NAMES } from '@repo/constants';

import { useTravelInfoActions } from '../useTravelInfoActions';

jest.mock('@copilotkit/react-native/headless', () => ({
  ToolCallStatus: { InProgress: 'inProgress', Executing: 'executing', Complete: 'complete' },
  useCopilotKit: jest.fn(),
  defineToolCallRenderer: (config: unknown) => config,
}));

import { useCopilotKit } from '@copilotkit/react-native/headless';

import { EmptyState, ErrorState, LoadingState } from '../../components/common';
import { LocalTipsCard } from '../../components/LocalTipsCard';

interface RegisteredRenderer {
  name: string;
  render: (props: { status: string; result: unknown; args: unknown }) => React.ReactElement;
}

const setup = () => {
  const addHookRenderToolCall = jest.fn();
  const copilotkit = { addHookRenderToolCall };

  (useCopilotKit as jest.Mock).mockReturnValue({ copilotkit });

  return { addHookRenderToolCall };
};

const getRenderer = (addHookRenderToolCall: jest.Mock): RegisteredRenderer =>
  addHookRenderToolCall.mock.calls.find(
    ([renderer]: [RegisteredRenderer]) => renderer.name === TOOL_NAMES.LOCAL_TIPS
  )?.[0] as RegisteredRenderer;

beforeEach(() => {
  jest.clearAllMocks();
});

test('registers a renderer for the local tips tool', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() => useTravelInfoActions());

  expect(addHookRenderToolCall).toHaveBeenCalledTimes(5);
  expect(getRenderer(addHookRenderToolCall).name).toBe(TOOL_NAMES.LOCAL_TIPS);
});

test('renders a loading state while the tool call is executing', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() => useTravelInfoActions());

  const element = getRenderer(addHookRenderToolCall).render({
    status: 'executing',
    result: undefined,
    args: {},
  });

  expect(element.type).toBe(LoadingState);
});

test('renders an explicit empty state when there are no tips', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() => useTravelInfoActions());

  const data = { country: 'Japan', count: 0, summary: 'No tips found', tips: [] };
  const element = getRenderer(addHookRenderToolCall).render({
    status: 'complete',
    result: data,
    args: {},
  });

  expect(element.type).toBe(EmptyState);
});

test('renders an error state for a malformed result', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() => useTravelInfoActions());

  const element = getRenderer(addHookRenderToolCall).render({
    status: 'complete',
    result: { not: 'a tips result' },
    args: {},
  });

  expect(element.type).toBe(ErrorState);
});

test('renders the local tips card with the parsed result', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() => useTravelInfoActions());

  const data = {
    country: 'Japan',
    city: 'Tokyo',
    count: 1,
    summary: 'One essential tip',
    tips: [
      {
        id: 't1',
        category: 'transport',
        scope: 'city',
        title: 'Get a Suica card',
        content: 'Use it for trains and convenience stores.',
        isEssential: true,
        location: null,
      },
    ],
  };
  const element = getRenderer(addHookRenderToolCall).render({
    status: 'complete',
    result: data,
    args: { city: 'Tokyo' },
  });

  expect(element.type).toBe(LocalTipsCard);
  expect(element.props).toEqual({ data });
});
