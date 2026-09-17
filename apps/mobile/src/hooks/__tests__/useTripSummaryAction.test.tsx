import { renderHook } from '@testing-library/react-native';

import { TOOL_NAMES } from '@repo/constants';

import { ErrorState, LoadingState } from '../../components/common';
import { TripSummaryCard } from '../../components/TripSummaryCard';
import { useTripSummaryAction } from '../useTripSummaryAction';

import type { TripState } from '@repo/types';

const mockUseRenderToolResult = jest.fn();

jest.mock('../useRenderToolResult', () => ({
  useRenderToolResult: (options: unknown, deps: unknown[]) =>
    mockUseRenderToolResult(options, deps),
}));

beforeEach(() => {
  mockUseRenderToolResult.mockClear();
});

const tripSummaryData = {
  destination: 'Da Nang',
  travelers: 2,
  days: 3,
  costEstimate: {
    flightTotal: 400,
    hotelTotal: 300,
    foodTotal: 100,
    activitiesTotal: 50,
    localTransportTotal: 20,
    grandTotal: 870,
    currency: 'USD',
    days: 3,
    travelers: 2,
    breakdown: [],
  },
};

test('registers with the tripSummaryTool name and passes state as a dep', async () => {
  const state: TripState = { destination: 'Da Nang' };

  await renderHook(() => useTripSummaryAction({ state }));

  expect(mockUseRenderToolResult).toHaveBeenCalledWith(
    expect.objectContaining({ name: TOOL_NAMES.TRIP_SUMMARY }),
    [state]
  );
});

test('render returns LoadingState while the tool call is in progress', async () => {
  await renderHook(() => useTripSummaryAction({ state: {} }));
  const [{ render }] = mockUseRenderToolResult.mock.calls[0];

  const result = render({ status: 'inProgress', result: undefined, args: {} });

  expect(result.type).toBe(LoadingState);
});

test('render returns ErrorState when the schema fails to parse', async () => {
  await renderHook(() => useTripSummaryAction({ state: {} }));
  const [{ render }] = mockUseRenderToolResult.mock.calls[0];

  const result = render({ status: 'complete', result: { unexpected: true }, args: {} });

  expect(result.type).toBe(ErrorState);
});

test('render returns TripSummaryCard with booked flight/hotel from state', async () => {
  const state: TripState = {
    flights: { departure: { id: 'f1' } } as TripState['flights'],
    hotel: { id: 'h1' } as TripState['hotel'],
  };

  await renderHook(() => useTripSummaryAction({ state }));
  const [{ render }] = mockUseRenderToolResult.mock.calls[0];

  const result = render({ status: 'complete', result: tripSummaryData, args: {} });

  expect(result.type).toBe(TripSummaryCard);
  expect(result.props.data).toEqual(tripSummaryData);
  expect(result.props.bookedFlight).toEqual(state.flights);
  expect(result.props.bookedHotel).toEqual(state.hotel);
});
