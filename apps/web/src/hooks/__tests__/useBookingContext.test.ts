import { renderHook } from '@testing-library/react';
import { useBookingContext } from '@/hooks/useBookingContext';

const mockUseAgentContext = jest.fn();
const mockState: Record<string, unknown> = {};

jest.mock('@copilotkit/react-core/v2', () => ({
  useAgentContext: (...args: unknown[]) => mockUseAgentContext(...args),
}));

jest.mock('@/hooks/useTripState', () => ({
  useTripState: () => ({ state: mockState }),
}));

beforeEach(() => {
  mockUseAgentContext.mockClear();

  for (const key of Object.keys(mockState)) delete mockState[key];
});

describe('useBookingContext', () => {
  it('exposes an empty booking state through agent context', () => {
    renderHook(() => useBookingContext());

    expect(mockUseAgentContext).toHaveBeenCalledTimes(1);
    expect(mockUseAgentContext).toHaveBeenCalledWith({
      description: expect.stringContaining('Current booking state'),
      value: { flights: null, hotel: null },
    });
  });

  it('publishes selected flight and hotel details through agent context', () => {
    mockState.flights = {
      departure: {
        origin: 'HAN',
        destination: 'SGN',
        departureTime: '2026-08-20T08:00:00Z',
        price: 120,
        currency: 'USD',
        airline: { name: 'Vietnam Airlines' },
      },
    };
    mockState.hotel = {
      name: 'Central Hotel',
      city: 'Ho Chi Minh City',
      pricePerNight: 80,
      currency: 'USD',
      rating: 4.5,
      nights: 2,
    };

    renderHook(() => useBookingContext());

    expect(mockUseAgentContext).toHaveBeenCalledWith({
      description: expect.stringContaining('Current booking state'),
      value: {
        flights: {
          departure: {
            origin: 'HAN',
            destination: 'SGN',
            date: '2026-08-20T08:00:00Z',
            price: 120,
            currency: 'USD',
            airline: 'Vietnam Airlines',
          },
          return: null,
        },
        hotel: {
          name: 'Central Hotel',
          city: 'Ho Chi Minh City',
          pricePerNight: 80,
          currency: 'USD',
          rating: 4.5,
          nights: 2,
        },
      },
    });
  });
});
