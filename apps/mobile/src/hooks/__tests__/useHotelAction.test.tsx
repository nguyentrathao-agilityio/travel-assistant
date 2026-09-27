import { renderHook } from '@testing-library/react-native';

import { BOOKING_STATUSES, TOOL_NAMES } from '@repo/constants';

import { useTravelBookingActions } from '../useTravelBookingActions';
import { makeSchemaHotel as makeHotel } from '../../test/fixtures';

import type { TripState } from '@repo/types';
import type { HotelAvailability } from '@repo/schemas';

jest.mock('@copilotkit/react-native/headless', () => ({
  ToolCallStatus: { InProgress: 'inProgress', Executing: 'executing', Complete: 'complete' },
  useCopilotKit: jest.fn(),
  defineToolCallRenderer: (config: unknown) => config,
}));

import { useCopilotKit } from '@copilotkit/react-native/headless';

import { EmptyState, ErrorState, LoadingState } from '../../components/common';
import { HotelCard } from '../../components/HotelCard';

type HotelCardTestProps = {
  initialHotel?: HotelAvailability | null;
  isConfirmed?: boolean;
  isBookingLocked?: boolean;
  city?: string;
  onContinueBooking?: (hotel: HotelAvailability) => void;
  onSelect?: (hotel: HotelAvailability) => void;
};

interface RegisteredRenderer {
  name: string;
  render: (props: {
    status: string;
    result: unknown;
    args: Record<string, unknown>;
  }) => React.ReactElement<HotelCardTestProps>;
}

const makeSearchResult = (hotel: HotelAvailability) => ({
  total: 1,
  limit: 10,
  offset: 0,
  results: [hotel],
  search: {
    city: 'Tokyo',
    checkIn: '2026-07-01',
    checkOut: '2026-07-03',
    nights: 2,
    rooms: 1,
    adults: 2,
  },
});

const setup = () => {
  const addHookRenderToolCall = jest.fn();
  const copilotkit = { addHookRenderToolCall };

  (useCopilotKit as jest.Mock).mockReturnValue({ copilotkit });

  return { addHookRenderToolCall };
};

const getRenderer = (addHookRenderToolCall: jest.Mock): RegisteredRenderer =>
  addHookRenderToolCall.mock.calls.find(
    ([renderer]: [RegisteredRenderer]) => renderer.name === TOOL_NAMES.HOTEL
  )?.[0] as RegisteredRenderer;

beforeEach(() => {
  jest.clearAllMocks();
});

test('registers a renderer for the hotel tool', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() =>
    useTravelBookingActions({
      state: {},
      selectFlight: jest.fn(),
      selectHotel: jest.fn(),
      sendMessage: jest.fn(),
    })
  );

  expect(addHookRenderToolCall).toHaveBeenCalledTimes(2);
  expect(getRenderer(addHookRenderToolCall).name).toBe(TOOL_NAMES.HOTEL);
});

test('renders a loading state while the tool call is in progress', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() =>
    useTravelBookingActions({
      state: {},
      selectFlight: jest.fn(),
      selectHotel: jest.fn(),
      sendMessage: jest.fn(),
    })
  );

  const element = getRenderer(addHookRenderToolCall).render({
    status: 'inProgress',
    result: undefined,
    args: {},
  });

  expect(element.type).toBe(LoadingState);
});

test('renders an explicit empty state when no hotels matched', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() =>
    useTravelBookingActions({
      state: {},
      selectFlight: jest.fn(),
      selectHotel: jest.fn(),
      sendMessage: jest.fn(),
    })
  );

  const element = getRenderer(addHookRenderToolCall).render({
    status: 'complete',
    result: { ...makeSearchResult(makeHotel()), results: [] },
    args: {},
  });

  expect(element.type).toBe(EmptyState);
});

test('renders an error state for a malformed result', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() =>
    useTravelBookingActions({
      state: {},
      selectFlight: jest.fn(),
      selectHotel: jest.fn(),
      sendMessage: jest.fn(),
    })
  );

  const element = getRenderer(addHookRenderToolCall).render({
    status: 'complete',
    result: { notAHotelResult: true },
    args: {},
  });

  expect(element.type).toBe(ErrorState);
});

test('renders the hotel card wired to the current selection and booking lock state', async () => {
  const { addHookRenderToolCall } = setup();
  const hotel = makeHotel();
  const state: TripState = {
    hotel,
    hotelBooking: {
      id: 'b1',
      confirmationCode: 'CC1',
      type: 'hotel',
      referenceId: 'h1',
      customerName: 'Jane',
      customerEmail: 'jane@example.com',
      totalPrice: 200,
      currency: 'USD',
      status: BOOKING_STATUSES.CONFIRMED,
      createdAt: '2026-01-01T00:00:00Z',
      summary: 'Hotel booked',
    },
  };

  await renderHook(() =>
    useTravelBookingActions({
      state,
      selectFlight: jest.fn(),
      selectHotel: jest.fn(),
      sendMessage: jest.fn(),
    })
  );

  const element = getRenderer(addHookRenderToolCall).render({
    status: 'complete',
    result: makeSearchResult(hotel),
    args: { city: 'Tokyo', checkIn: '2026-07-01', checkOut: '2026-07-03' },
  });

  expect(element.type).toBe(HotelCard);
  expect(element.props.initialHotel).toEqual(hotel);
  expect(element.props.isConfirmed).toBe(true);
  expect(element.props.isBookingLocked).toBe(true);
  expect(element.props.city).toBe('Tokyo');
});

test('onContinueBooking sends a message naming the selected hotel', async () => {
  const { addHookRenderToolCall } = setup();
  const sendMessage = jest.fn();
  const hotel = makeHotel({ id: 'h2', name: 'Ocean View' });

  await renderHook(() =>
    useTravelBookingActions({
      state: {},
      selectFlight: jest.fn(),
      selectHotel: jest.fn(),
      sendMessage,
    })
  );

  const element = getRenderer(addHookRenderToolCall).render({
    status: 'complete',
    result: makeSearchResult(hotel),
    args: {},
  });

  element.props.onContinueBooking!(hotel);

  expect(sendMessage).toHaveBeenCalledWith(expect.stringContaining('hotel h2 (Ocean View)'));
});

test('onSelect forwards the hotel to selectHotel', async () => {
  const { addHookRenderToolCall } = setup();
  const selectHotel = jest.fn();
  const hotel = makeHotel();

  await renderHook(() =>
    useTravelBookingActions({
      state: {},
      selectFlight: jest.fn(),
      selectHotel,
      sendMessage: jest.fn(),
    })
  );

  const element = getRenderer(addHookRenderToolCall).render({
    status: 'complete',
    result: makeSearchResult(hotel),
    args: {},
  });

  element.props.onSelect!(hotel);

  expect(selectHotel).toHaveBeenCalledWith(hotel);
});
