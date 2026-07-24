import type { ReactElement } from 'react';
import { render, renderHook, screen } from '@testing-library/react';
import { useRenderToolCall } from '@copilotkit/react-core';

import { TOOL_NAMES } from '@/constants';
import { useBookingAction } from '../useBookingAction';

type ToolRenderer = (props: { status: string; result?: unknown }) => ReactElement;

const getToolRenderer = (toolName: string): ToolRenderer => {
  const registration = jest
    .mocked(useRenderToolCall)
    .mock.calls.find(([options]) => options.name === toolName);

  return registration?.[0].render as ToolRenderer;
};

describe('useBookingAction', () => {
  beforeEach(() => {
    jest.mocked(useRenderToolCall).mockClear();
  });

  it.each([
    [TOOL_NAMES.BOOK_FLIGHT, 'flight'],
    [TOOL_NAMES.BOOK_HOTEL, 'hotel'],
  ])('renders a visible message when %s is rejected', (toolName, bookingType) => {
    renderHook(() => useBookingAction());

    const renderToolResult = getToolRenderer(toolName);
    render(
      renderToolResult({
        status: 'complete',
        result: JSON.stringify({ status: 'rejected', type: bookingType }),
      })
    );

    expect(screen.getByText('Booking not submitted')).toBeInTheDocument();
  });

  it('renders a visible message when cancellation is rejected', () => {
    renderHook(() => useBookingAction());

    const renderToolResult = getToolRenderer(TOOL_NAMES.CANCEL_BOOKING);
    render(
      renderToolResult({
        status: 'complete',
        result: JSON.stringify({ status: 'rejected', type: 'cancellation' }),
      })
    );

    expect(screen.getByText('Cancellation not submitted')).toBeInTheDocument();
    expect(screen.getByText('Your booking remains active.')).toBeInTheDocument();
  });
});
