import { renderHook, act } from '@testing-library/react';
import { useTripState } from '@/hooks/useTripState';
import type { Flight, HotelAvailability } from '@repo/types';

const mockSetState = jest.fn();
const mockUseCoAgent = jest.fn((_opts: { name: string }) => ({
  state: {},
  setState: mockSetState,
}));

jest.mock('@copilotkit/react-core', () => ({
  useCoAgent: (opts: { name: string }) => mockUseCoAgent(opts),
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
  mockUseCoAgent.mockClear();
  mockSetTripState.mockClear();
});

describe('useTripState', () => {
  it('initializes useCoAgent with the agent name', () => {
    renderHook(() => useTripState());
    expect(mockUseCoAgent).toHaveBeenCalledWith(expect.objectContaining({ name: 'travelAgent' }));
  });

  it('selectFlight calls setState with the flight under the correct type key', () => {
    const { result } = renderHook(() => useTripState());

    mockSetState.mockClear(); // clear the useEffect setState call on mount
    act(() => {
      result.current.selectFlight(makeFlight(), 'departure');
    });
    expect(mockSetState).toHaveBeenCalled();
    const updater = mockSetState.mock.calls[0][0];
    const newState = updater({});

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
    const updater = mockSetState.mock.calls[0][0];
    const newState = updater({});

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

  it('clearTrip calls setState with empty object', () => {
    const { result } = renderHook(() => useTripState());

    mockSetState.mockClear();
    act(() => {
      result.current.clearTrip();
    });
    expect(mockSetState).toHaveBeenCalled();
    const updater = mockSetState.mock.calls[0][0];
    const newState = updater({ flights: { departure: makeFlight() } });

    expect(newState).toEqual({});
  });
});
