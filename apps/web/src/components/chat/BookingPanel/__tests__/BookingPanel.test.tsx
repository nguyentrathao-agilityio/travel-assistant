import { render, screen } from '@testing-library/react';

import { BookingPanel } from '../index';

const mockUseTripState = jest.fn();

jest.mock('@/hooks', () => ({ useTripState: () => mockUseTripState() }));

describe('BookingPanel', () => {
  it.each([
    [
      'flight',
      {
        flights: {
          departure: {
            id: 'flight-1',
            origin: 'SGN',
            destination: 'HAN',
            airline: { name: 'Vietnam Airlines' },
            flightNumber: 'VN100',
            departureTime: '2026-09-10T08:00:00Z',
          },
        },
        flightSelectionStatus: 'cancelled',
      },
    ],
    [
      'hotel',
      {
        hotel: { id: 'hotel-1', name: 'Test Hotel', city: 'Hoi An', nights: 2 },
        hotelSelectionStatus: 'cancelled',
      },
    ],
  ] as const)('does not show a cancelled %s as a current booking', (_type, state) => {
    mockUseTripState.mockReturnValue({ state });

    render(<BookingPanel />);

    expect(screen.queryByRole('region', { name: 'Current bookings' })).not.toBeInTheDocument();
  });
});
