import type { ReactElement } from 'react';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useInterrupt, useRenderTool } from '@copilotkit/react-core/v2';

import { TOOL_NAMES } from '@/constants';
import { useBookingAction } from '../useBookingAction';

describe('useBookingAction', () => {
  beforeEach(() => {
    jest.mocked(useInterrupt).mockClear();
    jest.mocked(useRenderTool).mockClear();
  });

  it('resolves an unchanged booking as approval', () => {
    renderHook(() => useBookingAction());
    const registration = jest.mocked(useInterrupt).mock.calls[0][0];
    const value = bookingInterrupt(TOOL_NAMES.BOOK_FLIGHT, {
      flightId: 'FL1',
      adults: 1,
      customerName: 'Thao',
      customerEmail: 'thao@example.com',
      customerPhone: '0900000000',
    });
    const resolve = jest.fn();

    expect(registration.enabled?.({ name: 'on_interrupt', value })).toBe(true);
    render(registration.render?.({ event: { value }, resolve } as never) as ReactElement);
    fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }));

    expect(resolve).toHaveBeenCalledWith({ decisions: [{ type: 'approve' }] });
  });

  it('surfaces the phone number as an editable field on the approval card', () => {
    renderHook(() => useBookingAction());
    const registration = jest.mocked(useInterrupt).mock.calls[0][0];
    const value = bookingInterrupt(TOOL_NAMES.BOOK_FLIGHT, {
      flightId: 'FL1',
      customerName: 'Thao',
      customerEmail: 'thao@example.com',
      customerPhone: '0900000000',
    });

    render(
      registration.render?.({ event: { value }, resolve: jest.fn() } as never) as ReactElement
    );

    expect(screen.getByText('0900000000')).toBeInTheDocument();
  });

  it('recognizes a HITL request when the interrupt value arrives JSON-stringified, matching the real AG-UI wire format', () => {
    renderHook(() => useBookingAction());
    const registration = jest.mocked(useInterrupt).mock.calls[0][0];
    const value = JSON.stringify({
      actionRequests: [
        {
          name: TOOL_NAMES.BOOK_FLIGHT,
          args: {
            flightId: 'FL1',
            adults: 1,
            customerName: 'Thao',
            customerEmail: 'thao@example.com',
            customerPhone: '0900000000',
          },
          description: 'Tool execution requires approval',
        },
      ],
      reviewConfigs: [
        { actionName: TOOL_NAMES.BOOK_FLIGHT, allowedDecisions: ['approve', 'reject'] },
      ],
    });

    expect(registration.enabled?.({ name: 'on_interrupt', value })).toBe(true);
  });

  it('waits for confirmation before resuming with edited arguments', () => {
    renderHook(() => useBookingAction());
    const registration = jest.mocked(useInterrupt).mock.calls[0][0];
    const value = bookingInterrupt(TOOL_NAMES.BOOK_HOTEL, {
      hotelId: 'H1',
      rooms: 1,
      customerName: 'Thao',
      customerPhone: '0900000000',
    });
    const resolve = jest.fn();

    render(registration.render?.({ event: { value }, resolve } as never) as ReactElement);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('rooms'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(resolve).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking ↗' }));
    expect(resolve).toHaveBeenCalledWith({
      decisions: [
        {
          type: 'edit',
          editedAction: {
            name: TOOL_NAMES.BOOK_HOTEL,
            args: {
              hotelId: 'H1',
              rooms: 2,
              customerName: 'Thao',
              customerPhone: '0900000000',
            },
          },
        },
      ],
    });
  });

  it('rejects a cancelled booking request', () => {
    renderHook(() => useBookingAction());
    const registration = jest.mocked(useInterrupt).mock.calls[0][0];
    const value = bookingInterrupt(TOOL_NAMES.BOOK_HOTEL, { hotelId: 'H1' });
    const resolve = jest.fn();

    render(registration.render?.({ event: { value }, resolve } as never) as ReactElement);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(resolve).toHaveBeenCalledWith({
      decisions: [
        {
          type: 'reject',
          message: 'The user cancelled the booking request. The booking was NOT created.',
        },
      ],
    });
  });

  it('tells the agent a rejected cancellation leaves the booking active', () => {
    renderHook(() => useBookingAction());
    const registration = jest.mocked(useInterrupt).mock.calls[0][0];
    const value = bookingInterrupt(TOOL_NAMES.CANCEL_BOOKING, { bookingId: 'ABC123' }, false);
    const resolve = jest.fn();

    render(registration.render?.({ event: { value }, resolve } as never) as ReactElement);
    fireEvent.click(screen.getByRole('button', { name: 'Keep booking' }));

    expect(resolve).toHaveBeenCalledWith({
      decisions: [
        {
          type: 'reject',
          message:
            'The user rejected the cancellation. Booking ABC123 remains active and was NOT cancelled.',
        },
      ],
    });
  });

  it('does not render an error card for an intentional HITL rejection result', () => {
    renderHook(() => useBookingAction());
    const registration = jest
      .mocked(useRenderTool)
      .mock.calls.find((call) => call[0].name === TOOL_NAMES.CANCEL_BOOKING)?.[0];

    const { container } = render(
      registration!.render({
        status: 'complete',
        result:
          'The user rejected the cancellation. Booking ABC123 remains active and was NOT cancelled.',
      } as never) as ReactElement
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('does not render an error card when a duplicate booking is blocked', () => {
    renderHook(() => useBookingAction());
    const registration = jest
      .mocked(useRenderTool)
      .mock.calls.find((call) => call[0].name === TOOL_NAMES.BOOK_FLIGHT)?.[0];

    const { container } = render(
      registration!.render({
        status: 'complete',
        result:
          'Booking blocked: GZG3M5 is still an active flight booking. Cancel the active booking before creating a replacement.',
      } as never) as ReactElement
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Received an unexpected booking result.')).not.toBeInTheDocument();
  });

  it('shows an error card when the completed result matches neither the booking nor error schema', () => {
    renderHook(() => useBookingAction());
    const registration = jest
      .mocked(useRenderTool)
      .mock.calls.find((call) => call[0].name === TOOL_NAMES.BOOK_FLIGHT)?.[0];

    render(
      registration!.render({
        status: 'complete',
        result: JSON.stringify({ unexpected: 'shape' }),
      } as never) as ReactElement
    );

    expect(screen.getByText('Received an unexpected booking result.')).toBeInTheDocument();
  });
});

const bookingInterrupt = (name: string, args: Record<string, unknown>, allowEdit = true) => ({
  actionRequests: [{ name, args, description: 'Tool execution requires approval' }],
  reviewConfigs: [
    {
      actionName: name,
      allowedDecisions: allowEdit ? ['approve', 'edit', 'reject'] : ['approve', 'reject'],
    },
  ],
});
