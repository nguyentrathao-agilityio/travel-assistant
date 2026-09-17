import { renderHook } from '@testing-library/react-native';

import { BOOKING_STATUSES, FLIGHT_TAB, TOOL_NAMES, type FlightTab } from '@repo/constants';

import { useFlightAction } from '../useFlightAction';
import { makeFlight } from '../../test/fixtures';

import type { Flight, TripState } from '@repo/types';

jest.mock('@copilotkit/react-native/headless', () => ({
  ToolCallStatus: { InProgress: 'inProgress', Executing: 'executing', Complete: 'complete' },
  useCopilotKit: jest.fn(),
  defineToolCallRenderer: (config: unknown) => config,
}));

import { useCopilotKit } from '@copilotkit/react-native/headless';

import { EmptyState, ErrorState, LoadingState } from '../../components/common';
import { FlightCard } from '../../components/FlightCard';

type FlightCardTestProps = {
  initialDeparture?: Flight | null;
  isConfirmed?: boolean;
  isBookingLocked?: boolean;
  origin?: string;
  destination?: string;
  onContinueBooking?: (departure: Flight, returnFlight?: Flight) => void;
  onSelect?: (flight: Flight, type: FlightTab) => void;
};

interface RegisteredRenderer {
  name: string;
  render: (props: {
    status: string;
    result: unknown;
    args: Record<string, unknown>;
  }) => React.ReactElement<FlightCardTestProps>;
}

const setup = () => {
  const addHookRenderToolCall = jest.fn();
  const copilotkit = { addHookRenderToolCall };

  (useCopilotKit as jest.Mock).mockReturnValue({ copilotkit });

  return { addHookRenderToolCall };
};

const getRenderer = (addHookRenderToolCall: jest.Mock): RegisteredRenderer =>
  addHookRenderToolCall.mock.calls[0][0] as RegisteredRenderer;

beforeEach(() => {
  jest.clearAllMocks();
});

test('registers a renderer for the flights tool', async () => {
  const { addHookRenderToolCall } = setup();
  const selectFlight = jest.fn();
  const sendMessage = jest.fn();

  await renderHook(() => useFlightAction({ state: {}, selectFlight, sendMessage }));

  expect(addHookRenderToolCall).toHaveBeenCalledTimes(1);
  expect(getRenderer(addHookRenderToolCall).name).toBe(TOOL_NAMES.FLIGHTS);
});

test('renders a loading state while the tool call is in progress', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() =>
    useFlightAction({ state: {}, selectFlight: jest.fn(), sendMessage: jest.fn() })
  );

  const element = getRenderer(addHookRenderToolCall).render({
    status: 'inProgress',
    result: undefined,
    args: {},
  });

  expect(element.type).toBe(LoadingState);
});

test('renders an explicit empty state when no flights matched', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() =>
    useFlightAction({ state: {}, selectFlight: jest.fn(), sendMessage: jest.fn() })
  );

  const element = getRenderer(addHookRenderToolCall).render({
    status: 'complete',
    result: { results: [] },
    args: {},
  });

  expect(element.type).toBe(EmptyState);
});

test('renders an error state for a malformed result', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() =>
    useFlightAction({ state: {}, selectFlight: jest.fn(), sendMessage: jest.fn() })
  );

  const element = getRenderer(addHookRenderToolCall).render({
    status: 'complete',
    result: { notAFlightResult: true },
    args: {},
  });

  expect(element.type).toBe(ErrorState);
});

test('renders the flight card wired to the current selection and booking lock state', async () => {
  const { addHookRenderToolCall } = setup();
  const flight = makeFlight();
  const state: TripState = {
    flights: { departure: flight },
    flightBooking: {
      id: 'b1',
      confirmationCode: 'CC1',
      type: 'flight',
      referenceId: 'f1',
      customerName: 'Jane',
      customerEmail: 'jane@example.com',
      totalPrice: 200,
      currency: 'USD',
      status: BOOKING_STATUSES.CONFIRMED,
      createdAt: '2026-01-01T00:00:00Z',
      summary: 'Flight booked',
    },
  };

  await renderHook(() =>
    useFlightAction({ state, selectFlight: jest.fn(), sendMessage: jest.fn() })
  );

  const element = getRenderer(addHookRenderToolCall).render({
    status: 'complete',
    result: { results: [flight] },
    args: { origin: 'HAN', destination: 'SGN' },
  });

  expect(element.type).toBe(FlightCard);
  expect(element.props.initialDeparture).toEqual(flight);
  expect(element.props.isConfirmed).toBe(true);
  expect(element.props.isBookingLocked).toBe(true);
  expect(element.props.origin).toBe('HAN');
  expect(element.props.destination).toBe('SGN');
});

test('onContinueBooking sends a message naming the selected flights', async () => {
  const { addHookRenderToolCall } = setup();
  const sendMessage = jest.fn();
  const departure = makeFlight({ id: 'dep1', flightNumber: 'VN100' });
  const returnFlight = makeFlight({ id: 'ret1', flightNumber: 'VN200' });

  await renderHook(() => useFlightAction({ state: {}, selectFlight: jest.fn(), sendMessage }));

  const element = getRenderer(addHookRenderToolCall).render({
    status: 'complete',
    result: { results: [departure] },
    args: {},
  });

  element.props.onContinueBooking!(departure, returnFlight);

  expect(sendMessage).toHaveBeenCalledWith(expect.stringContaining('flight dep1 (VN100)'));
  expect(sendMessage).toHaveBeenCalledWith(expect.stringContaining('return flight ret1 (VN200)'));
});

test('onSelect forwards the flight to selectFlight', async () => {
  const { addHookRenderToolCall } = setup();
  const selectFlight = jest.fn();
  const flight = makeFlight();

  await renderHook(() => useFlightAction({ state: {}, selectFlight, sendMessage: jest.fn() }));

  const element = getRenderer(addHookRenderToolCall).render({
    status: 'complete',
    result: { results: [flight] },
    args: {},
  });

  element.props.onSelect!(flight, FLIGHT_TAB.DEPARTURE);

  expect(selectFlight).toHaveBeenCalledWith(flight, 'departure');
});
