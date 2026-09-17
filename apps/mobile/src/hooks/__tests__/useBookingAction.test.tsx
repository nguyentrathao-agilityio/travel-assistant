import { Fragment } from 'react';
import { renderHook } from '@testing-library/react-native';

import {
  AGENT_NAME,
  BOOKING_ACTIONS,
  BOOKING_APPROVAL_REQUEST_TYPE,
  BOOKING_CREATION_DECLINED_MESSAGE,
  BOOKING_DECISIONS,
  BOOKING_STATUSES,
  BOOKING_TYPES,
  TOOL_NAMES,
} from '@repo/constants';

import { useBookingAction } from '../useBookingAction';

jest.mock('@copilotkit/react-native/headless', () => ({
  ToolCallStatus: { InProgress: 'inProgress', Executing: 'executing', Complete: 'complete' },
  useCopilotKit: jest.fn(),
  useInterrupt: jest.fn(),
  defineToolCallRenderer: (config: unknown) => config,
}));

import { useCopilotKit, useInterrupt } from '@copilotkit/react-native/headless';

import { BookingApprovalCard } from '../../components/BookingApprovalCard';
import { BookingResultCard } from '../../components/BookingResultCard';
import { ErrorState } from '../../components/common';

import type { Booking, BookingApprovalRequest, BookingDecision } from '@repo/types';

type EditableBookingDetails = Record<string, string | number | boolean | null>;

type BookingResultTestProps = { booking?: Booking };

type BookingApprovalTestProps = {
  request?: BookingApprovalRequest;
  onDecision?: (decision: BookingDecision, editedDetails?: EditableBookingDetails) => void;
};

interface RegisteredRenderer {
  name: string;
  render: (props: {
    status: string;
    result: unknown;
    args: unknown;
  }) => React.ReactElement<BookingResultTestProps>;
}

interface InterruptConfig {
  agentId: string;
  enabled: (props: { value: unknown }) => boolean;
  render: (props: {
    event: { value: unknown };
    resolve: (response: unknown) => void;
  }) => React.ReactElement<BookingApprovalTestProps>;
}

const flightApprovalPayload = {
  actionRequests: [
    {
      name: TOOL_NAMES.BOOK_FLIGHT,
      args: { flightId: 'f1', passengerName: 'Jane Doe' },
      description: 'Book flight f1',
    },
  ],
  reviewConfigs: [
    {
      actionName: TOOL_NAMES.BOOK_FLIGHT,
      allowedDecisions: [BOOKING_DECISIONS.APPROVE, BOOKING_DECISIONS.REJECT],
    },
  ],
};

const cancelApprovalPayload = {
  actionRequests: [
    {
      name: TOOL_NAMES.CANCEL_BOOKING,
      args: { bookingId: 'b1' },
      description: 'Cancel booking b1',
    },
  ],
  reviewConfigs: [
    {
      actionName: TOOL_NAMES.CANCEL_BOOKING,
      allowedDecisions: [BOOKING_DECISIONS.APPROVE, BOOKING_DECISIONS.REJECT],
    },
  ],
};

const makeBookingResult = (overrides: Record<string, unknown> = {}) => ({
  id: 'b1',
  confirmationCode: 'CC1',
  type: BOOKING_TYPES.FLIGHT,
  referenceId: 'f1',
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  totalPrice: 200,
  currency: 'USD',
  status: BOOKING_STATUSES.CONFIRMED,
  createdAt: '2026-01-01T00:00:00Z',
  summary: 'Flight booked',
  ...overrides,
});

const setup = (interruptElement: unknown = null) => {
  const addHookRenderToolCall = jest.fn();
  const copilotkit = {
    addHookRenderToolCall,
    interruptElement,
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
  };

  (useCopilotKit as jest.Mock).mockReturnValue({ copilotkit });

  return { addHookRenderToolCall };
};

const getInterruptConfig = (): InterruptConfig =>
  (useInterrupt as jest.Mock).mock.calls[0][0] as InterruptConfig;

const getResultRenderer = (
  addHookRenderToolCall: jest.Mock,
  toolName: string
): RegisteredRenderer =>
  addHookRenderToolCall.mock.calls
    .map((call) => call[0] as RegisteredRenderer)
    .find((renderer) => renderer.name === toolName) as RegisteredRenderer;

beforeEach(() => {
  jest.clearAllMocks();
});

test('registers a HITL interrupt handler for the booking agent', async () => {
  setup();

  await renderHook(() => useBookingAction());

  expect(useInterrupt).toHaveBeenCalledTimes(1);
  expect(getInterruptConfig().agentId).toBe(AGENT_NAME);
});

test('registers result renderers for book flight, book hotel and cancel booking', async () => {
  const { addHookRenderToolCall } = setup();

  await renderHook(() => useBookingAction());

  const names = addHookRenderToolCall.mock.calls.map(
    (call) => (call[0] as RegisteredRenderer).name
  );

  expect(names).toEqual([TOOL_NAMES.BOOK_FLIGHT, TOOL_NAMES.BOOK_HOTEL, TOOL_NAMES.CANCEL_BOOKING]);
});

describe('interrupt enabled()', () => {
  test('is true for a recognized single-action booking approval payload', async () => {
    setup();

    await renderHook(() => useBookingAction());

    expect(getInterruptConfig().enabled({ value: flightApprovalPayload })).toBe(true);
  });

  test('is false for an unrelated interrupt payload', async () => {
    setup();

    await renderHook(() => useBookingAction());

    expect(getInterruptConfig().enabled({ value: { unrelated: true } })).toBe(false);
  });
});

describe('interrupt render()', () => {
  test('renders nothing when the request cannot be parsed', async () => {
    setup();

    await renderHook(() => useBookingAction());

    const element = getInterruptConfig().render({
      event: { value: { unrelated: true } },
      resolve: jest.fn(),
    });

    expect(element.type).toBe(Fragment);
  });

  test('renders the booking approval card for a parsed flight booking request', async () => {
    setup();

    await renderHook(() => useBookingAction());

    const element = getInterruptConfig().render({
      event: { value: flightApprovalPayload },
      resolve: jest.fn(),
    });

    expect(element.type).toBe(BookingApprovalCard);
    expect(element.props.request).toMatchObject({
      type: BOOKING_APPROVAL_REQUEST_TYPE,
      action: BOOKING_ACTIONS.CREATE_FLIGHT,
      referenceId: 'f1',
    });
  });

  test('approve decision resolves with an approve HITL response', async () => {
    setup();

    await renderHook(() => useBookingAction());

    const resolve = jest.fn();
    const element = getInterruptConfig().render({
      event: { value: flightApprovalPayload },
      resolve,
    });

    element.props.onDecision!(BOOKING_DECISIONS.APPROVE);

    expect(resolve).toHaveBeenCalledWith({
      decisions: [{ type: BOOKING_DECISIONS.APPROVE }],
    });
  });

  test('reject decision for a booking creation resolves with the generic decline message', async () => {
    setup();

    await renderHook(() => useBookingAction());

    const resolve = jest.fn();
    const element = getInterruptConfig().render({
      event: { value: flightApprovalPayload },
      resolve,
    });

    element.props.onDecision!(BOOKING_DECISIONS.REJECT);

    expect(resolve).toHaveBeenCalledWith({
      decisions: [{ type: BOOKING_DECISIONS.REJECT, message: BOOKING_CREATION_DECLINED_MESSAGE }],
    });
  });

  test('reject decision for a cancellation resolves with a reference-specific message', async () => {
    setup();

    await renderHook(() => useBookingAction());

    const resolve = jest.fn();
    const element = getInterruptConfig().render({
      event: { value: cancelApprovalPayload },
      resolve,
    });

    element.props.onDecision!(BOOKING_DECISIONS.REJECT);

    const response = resolve.mock.calls[0][0] as {
      decisions: [{ type: string; message: string }];
    };

    expect(response.decisions[0].type).toBe(BOOKING_DECISIONS.REJECT);
    expect(response.decisions[0].message).toContain('b1');
  });

  test('edit decision resolves with the merged action args', async () => {
    setup();

    await renderHook(() => useBookingAction());

    const resolve = jest.fn();
    const element = getInterruptConfig().render({
      event: { value: flightApprovalPayload },
      resolve,
    });

    element.props.onDecision!(BOOKING_DECISIONS.EDIT, { passengerName: 'John Smith' });

    expect(resolve).toHaveBeenCalledWith({
      decisions: [
        {
          type: BOOKING_DECISIONS.EDIT,
          editedAction: {
            name: TOOL_NAMES.BOOK_FLIGHT,
            args: { flightId: 'f1', passengerName: 'John Smith' },
          },
        },
      ],
    });
  });
});

describe('booking result renderer', () => {
  test('renders nothing while pending and an approval is in flight', async () => {
    const { addHookRenderToolCall } = setup({ someInterrupt: true });

    await renderHook(() => useBookingAction());

    const element = getResultRenderer(addHookRenderToolCall, TOOL_NAMES.BOOK_FLIGHT).render({
      status: 'inProgress',
      result: undefined,
      args: {},
    });

    expect(element.type).toBe(Fragment);
  });

  test('renders nothing for an intentional rejection result', async () => {
    const { addHookRenderToolCall } = setup(null);

    await renderHook(() => useBookingAction());

    const element = getResultRenderer(addHookRenderToolCall, TOOL_NAMES.BOOK_FLIGHT).render({
      status: 'complete',
      result: BOOKING_CREATION_DECLINED_MESSAGE,
      args: {},
    });

    expect(element.type).toBe(Fragment);
  });

  test('renders the booking result card for a completed booking', async () => {
    const { addHookRenderToolCall } = setup(null);

    await renderHook(() => useBookingAction());

    const booking = makeBookingResult();
    const element = getResultRenderer(addHookRenderToolCall, TOOL_NAMES.BOOK_FLIGHT).render({
      status: 'complete',
      result: booking,
      args: {},
    });

    expect(element.type).toBe(BookingResultCard);
    expect(element.props.booking).toEqual(booking);
  });

  test('renders an error state for a malformed completed result', async () => {
    const { addHookRenderToolCall } = setup(null);

    await renderHook(() => useBookingAction());

    const element = getResultRenderer(addHookRenderToolCall, TOOL_NAMES.BOOK_HOTEL).render({
      status: 'complete',
      result: { unexpected: true },
      args: {},
    });

    expect(element.type).toBe(ErrorState);
  });
});
