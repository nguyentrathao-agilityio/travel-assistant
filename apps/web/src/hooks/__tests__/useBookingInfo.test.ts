import { renderHook } from '@testing-library/react';
import { useBookingInfo } from '@/hooks/useBookingInfo';

const mockUseCopilotAction = jest.fn();

jest.mock('@copilotkit/react-core', () => ({
  useCopilotAction: (...args: unknown[]) => mockUseCopilotAction(...args),
}));

jest.mock('@/hooks/useTripState', () => ({
  useTripState: () => ({ state: {} }),
}));

jest.mock('@/constants', () => ({
  ACTIONS: {
    GET_FLIGHT_INFO: 'get-flight-info',
    GET_HOTEL_INFO: 'get-hotel-info',
  },
}));

beforeEach(() => mockUseCopilotAction.mockClear());

describe('useBookingInfo', () => {
  it('registers two CopilotKit actions on mount', () => {
    renderHook(() => useBookingInfo());
    expect(mockUseCopilotAction).toHaveBeenCalledTimes(2);
  });

  it('registers the get-flight-info action', () => {
    renderHook(() => useBookingInfo());
    const actionNames = mockUseCopilotAction.mock.calls.map((c) => c[0].name);
    expect(actionNames).toContain('get-flight-info');
  });

  it('registers the get-hotel-info action', () => {
    renderHook(() => useBookingInfo());
    const actionNames = mockUseCopilotAction.mock.calls.map((c) => c[0].name);
    expect(actionNames).toContain('get-hotel-info');
  });

  it('flight handler returns booked=false when no departure flight in state', async () => {
    renderHook(() => useBookingInfo());
    const flightCall = mockUseCopilotAction.mock.calls.find((c) => c[0].name === 'get-flight-info');
    const result = await flightCall![0].handler();
    expect(JSON.parse(result)).toEqual({ booked: false });
  });

  it('hotel handler returns booked=false when no hotel in state', async () => {
    renderHook(() => useBookingInfo());
    const hotelCall = mockUseCopilotAction.mock.calls.find((c) => c[0].name === 'get-hotel-info');
    const result = await hotelCall![0].handler();
    expect(JSON.parse(result)).toEqual({ booked: false });
  });
});
