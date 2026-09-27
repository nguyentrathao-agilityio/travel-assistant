import { renderHook } from '@testing-library/react-native';

import { TOOL_NAMES } from '@repo/constants';

import { ErrorState, LoadingState } from '../../components/common';
import { WeatherCard } from '../../components/WeatherCard';
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
    ([options]: [{ name: string }]) => options.name === TOOL_NAMES.WEATHER
  )?.[0];

const weatherData = {
  location: { name: 'Da Nang', country: 'Vietnam', latitude: 16.0, longitude: 108.2 },
  current: {
    time: '2026-09-17T08:00:00Z',
    temperatureC: 30,
    apparentTemperatureC: 33,
    relativeHumidity: 70,
    windSpeedKmh: 10,
    description: 'Sunny',
  },
  travelTip: 'Bring sunscreen.',
};

test('registers with the weatherTool name', async () => {
  await renderHook(() => useTravelInfoActions());

  expect(mockUseRenderToolResult).toHaveBeenCalledWith(
    expect.objectContaining({ name: TOOL_NAMES.WEATHER })
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

test('render surfaces a tool-reported error', async () => {
  await renderHook(() => useTravelInfoActions());
  const { render } = getRenderer();

  const result = render({
    status: 'complete',
    result: { error: 'Provider is down', code: 'PROVIDER_UNAVAILABLE' },
    args: {},
  });

  expect(result.type).toBe(ErrorState);
  expect(result.props.message).toBe('The provider is temporarily unavailable.');
});

test('render returns WeatherCard when parse succeeds', async () => {
  await renderHook(() => useTravelInfoActions());
  const { render } = getRenderer();

  const result = render({ status: 'complete', result: weatherData, args: {} });

  expect(result.type).toBe(WeatherCard);
  expect(result.props.data).toEqual(weatherData);
});
