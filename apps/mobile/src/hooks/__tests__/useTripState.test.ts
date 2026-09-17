import { act, renderHook, waitFor } from '@testing-library/react-native';

import { AGENT_NAME, SELECTION_STATUSES } from '@repo/constants';

import { useTripState } from '../useTripState';
import { makeFlight, makeHotel } from '../../test/fixtures';

import type { TripState } from '@repo/types';

const mockSetState = jest.fn();
const mockAgent = { state: {} as TripState, setState: mockSetState };
const mockUseAgent = jest.fn((_opts: { agentId: string }) => ({ agent: mockAgent }));

jest.mock('@copilotkit/react-native/headless', () => ({
  useAgent: (opts: { agentId: string }) => mockUseAgent(opts),
}));

const mockSetTripState = jest.fn();
const mockClearTripState = jest.fn();
let mockTripStates: Record<string, TripState> = {};

jest.mock('../../stores/tripStateStore', () => {
  const useTripStateStore = (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      get tripStates() {
        return mockTripStates;
      },
      setTripState: mockSetTripState,
      clearTripState: mockClearTripState,
    });

  useTripStateStore.getState = () => ({ tripStates: mockTripStates });

  return { useTripStateStore };
});

const mockFetchThreadValues = jest.fn();

jest.mock('../../services/threadHistory', () => ({
  fetchThreadValues: (threadId: string) => mockFetchThreadValues(threadId),
}));

jest.mock('@repo/utils', () => ({
  clientTimezone: () => 'Asia/Ho_Chi_Minh',
  todayClientIso: () => '2026-09-17',
}));

const mockExtractTripState = jest.fn();

jest.mock('../../utils/tripState', () => ({
  extractTripState: (values: unknown) => mockExtractTripState(values),
}));

beforeEach(() => {
  mockSetState.mockClear();
  mockUseAgent.mockClear();
  mockAgent.state = {};
  mockSetTripState.mockClear();
  mockClearTripState.mockClear();
  mockFetchThreadValues.mockClear();
  mockFetchThreadValues.mockResolvedValue(undefined);
  mockExtractTripState.mockReset();
  mockExtractTripState.mockReturnValue({});
  mockTripStates = {};
});

test('binds useAgent to the configured agent', async () => {
  await renderHook(() => useTripState('thread-1'));

  expect(mockUseAgent).toHaveBeenCalledWith(expect.objectContaining({ agentId: AGENT_NAME }));
});

test('restores from the local trip-state cache when present', async () => {
  mockTripStates = { 'thread-1': { destination: 'Da Nang' } };

  await renderHook(() => useTripState('thread-1'));

  await waitFor(() => {
    expect(mockSetState).toHaveBeenCalledWith({
      destination: 'Da Nang',
      clientDate: '2026-09-17',
      clientTimezone: 'Asia/Ho_Chi_Minh',
    });
  });
  expect(mockFetchThreadValues).not.toHaveBeenCalled();
});

test('falls back to the server checkpoint when there is no local cache', async () => {
  mockFetchThreadValues.mockResolvedValue({ destination: 'Hanoi' });
  mockExtractTripState.mockReturnValue({ destination: 'Hanoi' });

  await renderHook(() => useTripState('thread-1'));

  await waitFor(() => {
    expect(mockSetState).toHaveBeenCalledWith({
      destination: 'Hanoi',
      clientDate: '2026-09-17',
      clientTimezone: 'Asia/Ho_Chi_Minh',
    });
  });
});

test('selectFlight updates both the agent state and the trip store', async () => {
  const { result } = await renderHook(() => useTripState('thread-1'));

  await waitFor(() => expect(mockSetState).toHaveBeenCalled());
  mockSetState.mockClear();

  await act(async () => {
    result.current.selectFlight(makeFlight(), 'departure');
  });

  const newState = mockSetState.mock.calls[0][0];

  expect(newState.flights?.departure?.id).toBe('f1');
  expect(newState.flightSelectionStatus).toBe(SELECTION_STATUSES.CONFIRMED);
  expect(mockSetTripState).toHaveBeenCalledWith(
    'thread-1',
    expect.objectContaining({ flightSelectionStatus: SELECTION_STATUSES.CONFIRMED })
  );
});

test('selectHotel updates both the agent state and the trip store', async () => {
  const { result } = await renderHook(() => useTripState('thread-1'));

  await waitFor(() => expect(mockSetState).toHaveBeenCalled());
  mockSetState.mockClear();

  await act(async () => {
    result.current.selectHotel(makeHotel());
  });

  const newState = mockSetState.mock.calls[0][0];

  expect(newState.hotel?.id).toBe('h1');
  expect(newState.hotelSelectionStatus).toBe(SELECTION_STATUSES.CONFIRMED);
  expect(mockSetTripState).toHaveBeenCalledWith(
    'thread-1',
    expect.objectContaining({
      hotel: expect.objectContaining({ id: 'h1' }),
      hotelSelectionStatus: SELECTION_STATUSES.CONFIRMED,
    })
  );
});

test('clearTrip resets the agent state and the trip store', async () => {
  const { result } = await renderHook(() => useTripState('thread-1'));

  await waitFor(() => expect(mockSetState).toHaveBeenCalled());
  mockSetState.mockClear();

  await act(async () => {
    result.current.clearTrip();
  });

  expect(mockSetState).toHaveBeenCalledWith({});
  expect(mockClearTripState).toHaveBeenCalledWith('thread-1');
});

test('merges the cached trip state with the live agent state', async () => {
  mockTripStates = { 'thread-1': { destination: 'Da Nang' } };
  mockAgent.state = { travelers: 2 };

  const { result } = await renderHook(() => useTripState('thread-1'));

  expect(result.current.state).toEqual(
    expect.objectContaining({ destination: 'Da Nang', travelers: 2 })
  );
});
