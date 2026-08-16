import React from 'react';
import { renderHook } from '@testing-library/react';
import { useRenderToolCall } from '@copilotkit/react-core';
import { useHotelAction } from '@/hooks/useHotelAction';

jest.mock('@/hooks', () => ({
  useTripState: () => ({ selectHotel: jest.fn(), state: {} }),
}));

jest.mock('@/constants', () => ({
  TOOL_NAMES: { HOTEL: 'hotelTool' },
  TOOL_STATUS: { IN_PROGRESS: 'inProgress', EXECUTING: 'executing', COMPLETE: 'complete' },
}));

jest.mock('@/components', () => ({
  HotelCard: () => null,
  LoadingCard: () => null,
  SetLastTool: () => null,
  ToolLoading: () => null,
  ToolEmptyCard: () => null,
  ToolErrorCard: () => null,
  ToolInvalidResultCard: () => null,
}));

jest.mock('@/utils', () => ({
  ...jest.requireActual('@/utils/toolResult'),
  isToolPending: (status: string) => status === 'inProgress' || status === 'executing',
}));

const mockHotelSafeParse = jest.fn<{ success: boolean; data?: unknown }, unknown[]>(() => ({
  success: false,
}));
jest.mock('@repo/schemas', () => ({
  HotelAvailability: {},
  HotelSearchResultSchema: { safeParse: (arg: unknown) => mockHotelSafeParse(arg) },
}));

beforeEach(() => {
  jest.mocked(useRenderToolCall).mockClear();
  mockHotelSafeParse.mockReturnValue({ success: false });
});

describe('useHotelAction', () => {
  it('registers useRenderToolCall on mount', () => {
    renderHook(() => useHotelAction());
    expect(jest.mocked(useRenderToolCall)).toHaveBeenCalledTimes(1);
  });

  it('registers with the hotelTool name', () => {
    renderHook(() => useHotelAction());
    expect(jest.mocked(useRenderToolCall)).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'hotelTool' })
    );
  });

  it('render returns LoadingCard when status is inProgress', () => {
    renderHook(() => useHotelAction());
    const { render } = jest.mocked(useRenderToolCall).mock.calls[0][0];
    const result = render({ status: 'inProgress', result: undefined, args: {} });
    expect(result).not.toBeNull();
  });

  it('render returns ToolInvalidResultCard when status is complete and safeParse fails', () => {
    mockHotelSafeParse.mockReturnValue({ success: false });
    renderHook(() => useHotelAction());
    const { render } = jest.mocked(useRenderToolCall).mock.calls[0][0];
    const result = render({ status: 'complete', result: { total: 1, results: [] }, args: {} });
    expect(result.type).not.toBe(React.Fragment);
  });

  it('render returns an explicit empty state when total is 0', () => {
    mockHotelSafeParse.mockReturnValue({ success: true, data: { total: 0, results: [] } });
    renderHook(() => useHotelAction());
    const { render } = jest.mocked(useRenderToolCall).mock.calls[0][0];
    const result = render({ status: 'complete', result: { total: 0, results: [] }, args: {} });
    expect(result.type).not.toBe(React.Fragment);
  });

  it('render returns HotelCard when parse succeeds with results', () => {
    const hotelData = {
      total: 1,
      results: [
        {
          id: 'h1',
          shortCode: 'HA',
          code: 'HA001',
          name: 'Hotel A',
          city: 'Da Nang',
          country: 'Vietnam',
          address: '1 Beach Rd',
          starRating: 4,
          pricePerNight: 80,
          currency: 'USD',
          amenities: ['WiFi', 'Pool'],
          rating: 4.2,
          reviewCount: 200,
          imageUrl: '',
          available: true,
          availableRooms: 5,
          maxOccupancyPerRoom: 2,
          nights: 3,
          totalPrice: 240,
        },
      ],
    };
    mockHotelSafeParse.mockReturnValue({ success: true, data: hotelData });
    renderHook(() => useHotelAction());
    const { render } = jest.mocked(useRenderToolCall).mock.calls[0][0];
    const result = render({
      status: 'complete',
      result: hotelData,
      args: { city: 'Da Nang', checkIn: '2026-07-01', checkOut: '2026-07-04' },
    });
    expect(result).not.toBeNull();
    const [card] = (result as React.ReactElement<{ children: React.ReactNode[] }>).props.children;
    expect(card).not.toBeNull();
  });

  it('render returns empty fragment when status is not complete', () => {
    renderHook(() => useHotelAction());
    const { render } = jest.mocked(useRenderToolCall).mock.calls[0][0];
    const result = render({ status: 'complete', result: undefined, args: {} });
    expect(result.type).toBe(React.Fragment);
  });
});
