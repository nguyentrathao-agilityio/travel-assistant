import React from 'react';
import { renderHook } from '@testing-library/react';
import { useFrontendTool } from '@copilotkit/react-core/v2';
import { useBookedActions } from '@/hooks/useBookedActions';

const mockState: {
  flights?: { departure?: object; return?: object } | null;
  hotel?: object | null;
} = {};

jest.mock('@/hooks/useTripState', () => ({
  useTripState: () => ({ state: mockState }),
}));

jest.mock('@/constants', () => ({
  ACTIONS: {
    SHOW_BOOKED_FLIGHTS: 'show-booked-flights',
    SHOW_BOOKED_HOTEL: 'show-booked-hotel',
  },
}));

jest.mock('@/components', () => ({
  LoadingCard: () => null,
  FlightOptionItem: ({ flight }: { flight: { flightNumber: string } }) => (
    <div data-testid="flight-option-item">{flight.flightNumber}</div>
  ),
  HotelOptionItem: ({ hotel }: { hotel: { name: string } }) => (
    <div data-testid="hotel-option-item">{hotel.name}</div>
  ),
}));

jest.mock('@/utils', () => ({ isToolPending: (s: string) => s === 'inProgress' }));

beforeEach(() => {
  jest.mocked(useFrontendTool).mockClear();
  mockState.flights = undefined;
  mockState.hotel = undefined;
});

type RenderFn = (props: { status: string; args?: unknown; result?: unknown }) => React.ReactElement;

const getFlightsRender = () => {
  const call = jest
    .mocked(useFrontendTool)
    .mock.calls.find((c) => c[0].name === 'show-booked-flights');

  return call![0].render as RenderFn;
};

const getHotelRender = () => {
  const call = jest
    .mocked(useFrontendTool)
    .mock.calls.find((c) => c[0].name === 'show-booked-hotel');

  return call![0].render as RenderFn;
};

describe('useBookedActions', () => {
  it('registers two CopilotKit actions on mount', () => {
    renderHook(() => useBookedActions());
    expect(jest.mocked(useFrontendTool)).toHaveBeenCalledTimes(2);
  });

  it('registers the show-booked-flights action', () => {
    renderHook(() => useBookedActions());
    const names = jest.mocked(useFrontendTool).mock.calls.map((c) => c[0].name);

    expect(names).toContain('show-booked-flights');
  });

  it('registers the show-booked-hotel action', () => {
    renderHook(() => useBookedActions());
    const names = jest.mocked(useFrontendTool).mock.calls.map((c) => c[0].name);

    expect(names).toContain('show-booked-hotel');
  });

  describe('show-booked-flights render', () => {
    it('returns LoadingCard when pending', () => {
      renderHook(() => useBookedActions());
      const render = getFlightsRender();
      const result = render({ status: 'inProgress', args: {} });

      expect(result).not.toBeNull();
    });

    it('returns "no flights" message when no departure or return', () => {
      mockState.flights = undefined;
      renderHook(() => useBookedActions());
      const render = getFlightsRender();
      const result = render({ status: 'complete', args: {} });

      expect(result.type).toBe(React.Fragment);
    });

    it('renders departure flight when departure is set', () => {
      const departure = {
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
        seatsAvailable: 5,
        stops: 0,
      };

      mockState.flights = { departure };
      renderHook(() => useBookedActions());
      const render = getFlightsRender();
      const result = render({ status: 'complete', args: {} });

      expect(result).not.toBeNull();
      expect(result.type).not.toBe(React.Fragment);
    });

    it('renders both departure and return flights when both are set', () => {
      const makeFlight = (id: string, num: string) => ({
        id,
        airline: { code: 'VN', name: 'Vietnam Airlines' },
        flightNumber: num,
        origin: 'HAN',
        destination: 'SGN',
        departureTime: '2026-07-01T08:00:00Z',
        arrivalTime: '2026-07-01T10:00:00Z',
        durationMinutes: 120,
        price: 200,
        currency: 'USD',
        seatsAvailable: 5,
        stops: 0,
      });

      mockState.flights = {
        departure: makeFlight('f1', 'VN100'),
        return: makeFlight('f2', 'VN200'),
      };
      renderHook(() => useBookedActions());
      const render = getFlightsRender();
      const result = render({ status: 'complete', args: {} });

      expect(result).not.toBeNull();
      expect(result.type).not.toBe(React.Fragment);
    });
  });

  describe('show-booked-hotel render', () => {
    it('returns LoadingCard when pending', () => {
      renderHook(() => useBookedActions());
      const render = getHotelRender();
      const result = render({ status: 'inProgress', args: {} });

      expect(result).not.toBeNull();
    });

    it('returns "no hotel" message when hotel is not set', () => {
      mockState.hotel = undefined;
      renderHook(() => useBookedActions());
      const render = getHotelRender();
      const result = render({ status: 'complete', args: {} });

      expect(result.type).toBe(React.Fragment);
    });

    it('renders hotel when hotel is set', () => {
      mockState.hotel = {
        id: 'h1',
        shortCode: 'HA',
        name: 'Hotel A',
        city: 'Da Nang',
        country: 'Vietnam',
        address: '1 Beach Rd',
        starRating: 4,
        pricePerNight: 80,
        currency: 'USD',
        amenities: ['WiFi'],
        rating: 4.2,
        reviewCount: 200,
        imageUrl: '',
        available: true,
        availableRooms: 5,
        maxOccupancyPerRoom: 2,
        nights: 3,
        totalPrice: 240,
      };
      renderHook(() => useBookedActions());
      const render = getHotelRender();
      const result = render({ status: 'complete', args: {} });

      expect(result).not.toBeNull();
      expect(result.type).not.toBe(React.Fragment);
    });
  });
});
