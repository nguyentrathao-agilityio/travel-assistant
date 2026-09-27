import { renderHook } from '@testing-library/react-native';

import { TOOL_NAMES } from '@repo/constants';

import { EmptyState, ErrorState, LoadingState } from '../../components/common';
import { RouteCard } from '../../components/RouteCard';
import { useTravelInfoActions } from '../useTravelInfoActions';

const mockUseRenderToolResult = jest.fn();

jest.mock('../useRenderToolResult', () => ({
  useRenderToolResult: (options: unknown) => mockUseRenderToolResult(options),
}));

beforeEach(() => {
  mockUseRenderToolResult.mockClear();
});

const getRenderer = () =>
  mockUseRenderToolResult.mock.calls.find(
    ([options]: [{ name: string }]) => options.name === TOOL_NAMES.ROUTE
  )?.[0];

const routeData = {
  city: 'Da Nang',
  totalDurationMin: 180,
  stops: [{ name: 'Marble Mountains', city: 'Da Nang' }],
  legs: [{ mode: 'walk', durationMin: 10, distanceKm: 1 }],
};

test('registers with the routeTool name', async () => {
  await renderHook(() => useTravelInfoActions());

  expect(mockUseRenderToolResult).toHaveBeenCalledWith(
    expect.objectContaining({ name: TOOL_NAMES.ROUTE })
  );
});

test('render returns LoadingState while the tool call is in progress', async () => {
  await renderHook(() => useTravelInfoActions());
  const { render } = getRenderer();

  const result = render({ status: 'inProgress', result: undefined, args: {} });

  expect(result.type).toBe(LoadingState);
});

test('render returns ErrorState when the schema fails to parse', async () => {
  await renderHook(() => useTravelInfoActions());
  const { render } = getRenderer();

  const result = render({ status: 'complete', result: { unexpected: true }, args: {} });

  expect(result.type).toBe(ErrorState);
});

test('render returns EmptyState when no route stops were found', async () => {
  await renderHook(() => useTravelInfoActions());
  const { render } = getRenderer();

  const result = render({
    status: 'complete',
    result: { ...routeData, stops: [] },
    args: {},
  });

  expect(result.type).toBe(EmptyState);
});

test('render returns RouteCard when parse succeeds with stops', async () => {
  await renderHook(() => useTravelInfoActions());
  const { render } = getRenderer();

  const result = render({ status: 'complete', result: routeData, args: {} });

  expect(result.type).toBe(RouteCard);
  expect(result.props.data).toEqual(routeData);
});
