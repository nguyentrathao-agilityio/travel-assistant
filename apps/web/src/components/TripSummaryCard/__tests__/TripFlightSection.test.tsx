import React from 'react';
import { render, screen } from '@testing-library/react';
import { TripFlightSection } from '../TripFlightSection';
import type { Flight } from '@repo/types';

jest.mock('@/components', () => ({
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  FlightOptionItem: ({ flight }: { flight: { flightNumber: string } }) => (
    <div data-testid="flight-option-item">{flight.flightNumber}</div>
  ),
}));

jest.mock('@/utils', () => ({ cn: (...args: string[]) => args.filter(Boolean).join(' ') }));

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
  seatsAvailable: 5,
  stops: 0,
});

describe('TripFlightSection', () => {
  it('returns null when neither suggested nor booked is provided', () => {
    const { container } = render(<TripFlightSection />);

    expect(container.firstChild).toBeNull();
  });

  it('renders flight info when suggested is provided', () => {
    const flight = makeFlight();

    render(<TripFlightSection suggested={flight} />);
    expect(screen.getByTestId('flight-option-item')).toBeInTheDocument();
    expect(screen.getByText('VN100')).toBeInTheDocument();
  });

  it('shows "suggested" badge when no booked flight', () => {
    const flight = makeFlight();

    render(<TripFlightSection suggested={flight} />);
    expect(screen.getByText('suggested')).toBeInTheDocument();
  });

  it('shows "booked" badge when booked flight is provided', () => {
    const flight = makeFlight();

    render(<TripFlightSection booked={flight} />);
    expect(screen.getByText('booked')).toBeInTheDocument();
  });

  it('renders return flight section when bookedReturn is provided', () => {
    const departure = makeFlight();
    const returnFlight = { ...makeFlight(), id: 'f2', flightNumber: 'VN200' };

    render(<TripFlightSection booked={departure} bookedReturn={returnFlight} />);
    expect(screen.getByText('Departure')).toBeInTheDocument();
    expect(screen.getByText('Return')).toBeInTheDocument();
    expect(screen.getAllByTestId('flight-option-item')).toHaveLength(2);
  });

  it('does not render return section when bookedReturn is not provided', () => {
    const flight = makeFlight();

    render(<TripFlightSection booked={flight} />);
    expect(screen.queryByText('Departure')).not.toBeInTheDocument();
    expect(screen.queryByText('Return')).not.toBeInTheDocument();
  });
});
