import type { ReactElement } from 'react';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useLangGraphInterrupt } from '@copilotkit/react-core';
import { useRenderTool } from '@copilotkit/react-core/v2';

import { TOOL_NAMES } from '@/constants';
import { useBookingAction } from '../useBookingAction';

describe('useBookingAction', () => {
  beforeEach(() => {
    jest.mocked(useLangGraphInterrupt).mockClear();
    jest.mocked(useRenderTool).mockClear();
  });

  it('renders LangChain HITL requests and resolves approval with a structured decision', () => {
    renderHook(() => useBookingAction());
    const registration = jest.mocked(useLangGraphInterrupt).mock.calls[0][0];
    const value = {
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
    };
    const resolve = jest.fn();

    expect(registration.enabled?.({ eventValue: value } as never)).toBe(true);
    render(registration.render?.({ event: { value }, resolve } as never) as ReactElement);
    fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }));

    expect(resolve).toHaveBeenCalledWith({ decisions: [{ type: 'approve' }] });
  });

  it('tells the agent an edit request did not create the booking', () => {
    renderHook(() => useBookingAction());
    const registration = jest.mocked(useLangGraphInterrupt).mock.calls[0][0];
    const value = {
      actionRequests: [
        {
          name: TOOL_NAMES.BOOK_HOTEL,
          args: { hotelId: 'H1', customerName: 'Thao' },
          description: 'Tool execution requires approval',
        },
      ],
      reviewConfigs: [
        { actionName: TOOL_NAMES.BOOK_HOTEL, allowedDecisions: ['approve', 'reject'] },
      ],
    };
    const resolve = jest.fn();

    render(registration.render?.({ event: { value }, resolve } as never) as ReactElement);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(resolve).toHaveBeenCalledWith({
      decisions: [
        {
          type: 'reject',
          message:
            'The user requested changes. The booking was NOT created. Ask what they want to change before proposing a new booking.',
        },
      ],
    });
  });

  it('tells the agent a rejected cancellation leaves the booking active', () => {
    renderHook(() => useBookingAction());
    const registration = jest.mocked(useLangGraphInterrupt).mock.calls[0][0];
    const value = {
      actionRequests: [
        {
          name: TOOL_NAMES.CANCEL_BOOKING,
          args: { bookingId: 'ABC123' },
          description: 'Tool execution requires approval',
        },
      ],
      reviewConfigs: [
        { actionName: TOOL_NAMES.CANCEL_BOOKING, allowedDecisions: ['approve', 'reject'] },
      ],
    };
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
