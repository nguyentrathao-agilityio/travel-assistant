import React from 'react';
import { renderHook } from '@testing-library/react';
import { useRenderToolCall } from '@copilotkit/react-core';
import { useTripSummaryAction } from '@/hooks/useTripSummaryAction';

jest.mock('@/hooks/useTripState', () => ({
  useTripState: () => ({ state: {} }),
}));

jest.mock('@/constants', () => ({ TOOL_NAMES: { TRIP_SUMMARY: 'tripSummaryTool' } }));
jest.mock('@/components', () => ({
  TripSummaryCard: () => null,
  LoadingCard: () => null,
  SetLastTool: () => null,
  ToolLoading: () => null,
  ToolErrorCard: () => null,
  ToolInvalidResultCard: () => null,
}));
jest.mock('@/utils', () => ({
  ...jest.requireActual('@/utils/toolResult'),
  isToolPending: (s: string) => s === 'inProgress',
}));

const mockSafeParse = jest.fn<{ success: boolean; data?: unknown }, unknown[]>(() => ({
  success: false,
}));

jest.mock('@repo/schemas', () => ({
  TripSummaryResultSchema: { safeParse: (arg: unknown) => mockSafeParse(arg) },
}));

beforeEach(() => {
  jest.mocked(useRenderToolCall).mockClear();
  mockSafeParse.mockReturnValue({ success: false });
});

describe('useTripSummaryAction', () => {
  it('registers with the tripSummaryTool name', () => {
    renderHook(() => useTripSummaryAction());
    expect(jest.mocked(useRenderToolCall)).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'tripSummaryTool' })
    );
  });

  it('render returns LoadingCard when status is pending', () => {
    renderHook(() => useTripSummaryAction());
    const { render } = jest.mocked(useRenderToolCall).mock.calls[0][0];
    const result = render({ status: 'inProgress', args: {}, result: undefined });

    expect(result).not.toBeNull();
  });

  it('render returns ToolInvalidResultCard when safeParse fails', () => {
    mockSafeParse.mockReturnValue({ success: false });
    renderHook(() => useTripSummaryAction());
    const { render } = jest.mocked(useRenderToolCall).mock.calls[0][0];
    const result = render({ status: 'complete', args: {}, result: {} });

    expect(result.type).not.toBe(React.Fragment);
  });

  it('render returns TripSummaryCard when parse succeeds', () => {
    const summaryData = {
      destination: 'Da Nang',
      travelers: 2,
      days: 3,
      costEstimate: {
        grandTotal: 1500,
        currency: 'USD',
        days: 3,
        travelers: 2,
        flightTotal: 800,
        hotelTotal: 600,
        foodTotal: 100,
        activitiesTotal: 0,
        localTransportTotal: 0,
        breakdown: [{ label: 'Flight', amount: 800, currency: 'USD' }],
      },
    };

    mockSafeParse.mockReturnValue({ success: true, data: summaryData });
    renderHook(() => useTripSummaryAction());
    const { render } = jest.mocked(useRenderToolCall).mock.calls[0][0];
    const result = render({ status: 'complete', args: {}, result: summaryData });

    expect(result).not.toBeNull();
    const [card] = (result as React.ReactElement<{ children: React.ReactNode[] }>).props.children;

    expect(card).not.toBeNull();
  });
});
