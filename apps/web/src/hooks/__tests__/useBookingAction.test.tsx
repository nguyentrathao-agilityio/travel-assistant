import type { ReactElement } from 'react';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useLangGraphInterrupt, useRenderToolCall } from '@copilotkit/react-core';

import { TOOL_NAMES } from '@/constants';
import { useBookingAction } from '../useBookingAction';

describe('useBookingAction', () => {
  beforeEach(() => {
    jest.mocked(useLangGraphInterrupt).mockClear();
    jest.mocked(useRenderToolCall).mockClear();
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

  it('resolves edit as a rejected tool execution so the agent can refine', () => {
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
      decisions: [{ type: 'reject', message: 'User cancelled or requested changes.' }],
    });
  });

  it('shows an error card when the completed result matches neither the booking nor error schema', () => {
    renderHook(() => useBookingAction());
    const registration = jest
      .mocked(useRenderToolCall)
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
