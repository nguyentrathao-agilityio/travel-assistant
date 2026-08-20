import { renderHook, act } from '@testing-library/react';
import { useTripState } from '@/hooks/useTripState';
import type { Flight, HotelAvailability } from '@repo/types';

const mockSetState = jest.fn();
const mockAgent = { state: {} as Record<string, unknown>, setState: mockSetState };
const mockUseAgent = jest.fn((_opts: { agentId: string }) => ({ agent: mockAgent }));

jest.mock('@copilotkit/react-core/v2', () => ({
  useAgent: (opts: { agentId: string }) => mockUseAgent(opts),
}));

jest.mock('@/constants', () => ({ AGENT_NAME: 'travelAgent' }));

const mockClearTripState = jest.fn();
const mockSetTripState = jest.fn();

jest.mock('@/stores', () => {
  const tripStateHook = (
    selector: (s: {
      tripStates: Record<string, object>;
      setTripState: jest.Mock;
      clearTripState: jest.Mock;
    }) => unknown
  ) =>
    selector({
      tripStates: {},
      setTripState: mockSetTripState,
      clearTripState: mockClearTripState,
    });

  Object.assign(tripStateHook, { getState: () => ({ tripStates: {} }) });

  return {
    useThreadStore: (selector: (s: { activeThreadId: string }) => unknown) =>
      selector({ activeThreadId: 'session-1' }),
    useTripStateStore: tripStateHook,
  };
});

jest.mock('zustand/shallow', () => ({ useShallow: (fn: unknown) => fn }));

const makeFlight = (): Flight => ({
  id: 'f1',
  airline: { code: 'VN', name: 'Vietnam Airlines' },
  flightNumber: 'VN100',
  origin: 'HAN',
  destination: 'SGN',
  departureTime: '2026-07-01T08:00:00Z',
  arrivalTime: '2026-07-01T10:00:00Z',
  durationMinutes: 120,
  price: 200,
  currency: 'USD',
  seatsAvailable: 10,
  stops: 0,
});

const makeHotel = (): HotelAvailability => ({
  id: 'h1',
  shortCode: 'TST',
  name: 'Test Hotel',
  city: 'Da Nang',
  country: 'Vietnam',
  address: '123 Beach Rd',
  starRating: 4,
  pricePerNight: 100,
  currency: 'USD',
  amenities: ['wifi'],
  rating: 4.5,
  reviewCount: 100,
  imageUrl: 'https://example.com/img.jpg',
  available: true,
  availableRooms: 5,
  maxOccupancyPerRoom: 2,
  nights: 3,
  totalPrice: 300,
});

beforeEach(() => {
  mockSetState.mockClear();
  mockUseAgent.mockClear();
  mockAgent.state = {};
  mockSetTripState.mockClear();
});

describe('useTripState', () => {
  it('binds useAgent to the configured V2 agent', () => {
    renderHook(() => useTripState());
    expect(mockUseAgent).toHaveBeenCalledWith(expect.objectContaining({ agentId: 'travelAgent' }));
  });

  it('selectFlight calls setState with the flight under the correct type key', () => {
    const { result } = renderHook(() => useTripState());

    mockSetState.mockClear(); // clear the useEffect setState call on mount
    act(() => {
      result.current.selectFlight(makeFlight(), 'departure');
    });
    expect(mockSetState).toHaveBeenCalled();
    const newState = mockSetState.mock.calls[0][0];

    expect(newState.flights?.departure?.id).toBe('f1');
    expect(newState.flightSelectionStatus).toBe('confirmed');
    expect(mockSetTripState).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({ flightSelectionStatus: 'confirmed' })
    );
  });

  it('selectHotel calls setState with the hotel', () => {
    const { result } = renderHook(() => useTripState());

    mockSetState.mockClear();
    act(() => {
      result.current.selectHotel(makeHotel());
    });
    expect(mockSetState).toHaveBeenCalled();
    const newState = mockSetState.mock.calls[0][0];

    expect(newState.hotel?.id).toBe('h1');
    expect(newState.hotelSelectionStatus).toBe('confirmed');
    expect(mockSetTripState).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({
        hotel: expect.objectContaining({ id: 'h1' }),
        hotelSelectionStatus: 'confirmed',
      })
    );
  });

  it('surfaces a confirmed booking streamed back from the agent', () => {
    const flightBooking = { id: 'b1', confirmationCode: 'TRIP-1', status: 'confirmed' };

    mockAgent.state = { flightBooking };

    const { result } = renderHook(() => useTripState());

    expect(result.current.state.flightBooking).toEqual(flightBooking);
  });

  it('clearTrip calls setState with empty object', () => {
    const { result } = renderHook(() => useTripState());

    mockSetState.mockClear();
    act(() => {
      result.current.clearTrip();
    });
    expect(mockSetState).toHaveBeenCalled();
    expect(mockSetState).toHaveBeenCalledWith({});
  });
});
