import { renderHook } from '@testing-library/react-native';

import { TOOL_NAMES } from '@repo/constants';

import { useTravelInfoActions } from '../useTravelInfoActions';

jest.mock('@copilotkit/react-native/headless', () => ({
  ToolCallStatus: { InProgress: 'inProgress', Executing: 'executing', Complete: 'complete' },
  useCopilotKit: jest.fn(),
  defineToolCallRenderer: (config: unknown) => config,
}));

import { useCopilotKit } from '@copilotkit/react-native/headless';

import { ErrorState, LoadingState } from '../../components/common';
import { DestinationExplorerCard } from '../../components/DestinationExplorerCard';

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
    ([renderer]: [RegisteredRenderer]) => renderer.name === TOOL_NAMES.DESTINATION_EXPLORER
  )?.[0] as RegisteredRenderer;

beforeEach(() => {
  jest.clearAllMocks();
});

test('registers a renderer for the destination explorer tool', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() => useTravelInfoActions());

  expect(addHookRenderToolCall).toHaveBeenCalledTimes(5);
  expect(getRenderer(addHookRenderToolCall).name).toBe(TOOL_NAMES.DESTINATION_EXPLORER);
});

test('renders a loading state while the tool call is in progress', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() => useTravelInfoActions());

  const element = getRenderer(addHookRenderToolCall).render({
    status: 'inProgress',
    result: undefined,
    args: {},
  });

  expect(element.type).toBe(LoadingState);
});

test('renders an error state when the result does not match the schema', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() => useTravelInfoActions());

  const element = getRenderer(addHookRenderToolCall).render({
    status: 'complete',
    result: { unexpected: true },
    args: {},
  });

  expect(element.type).toBe(ErrorState);
});

test('renders the destination explorer card with the parsed result', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() => useTravelInfoActions());

  const data = { city: 'Tokyo', places: null, tips: null, weather: null };
  const element = getRenderer(addHookRenderToolCall).render({
    status: 'complete',
    result: data,
    args: { city: 'Tokyo' },
  });

  expect(element.type).toBe(DestinationExplorerCard);
  expect(element.props).toEqual({ data });
});

test('parses a JSON-stringified result the same way as an object result', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() => useTravelInfoActions());

  const data = { city: 'Da Nang', places: null, tips: null, weather: null };
  const element = getRenderer(addHookRenderToolCall).render({
    status: 'complete',
    result: JSON.stringify(data),
    args: {},
  });

  expect(element.type).toBe(DestinationExplorerCard);
  expect(element.props).toEqual({ data });
});
