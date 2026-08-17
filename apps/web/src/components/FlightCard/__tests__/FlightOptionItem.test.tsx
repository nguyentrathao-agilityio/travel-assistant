import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlightOptionItem } from '../FlightOptionItem';
import type { Flight } from '@repo/types';

jest.mock('@/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
  formatDuration: (min: number) => `${min}m`,
  formatPrice: (price: number, currency: string) => `${currency} ${price}`,
  formatTime: (iso: string) => iso.split('T')[1]?.slice(0, 5) ?? iso,
  getAirlineIconClass: () => 'airline-icon-class',
}));

jest.mock('@/constants', () => ({
  FLIGHT_LOW_SEATS_THRESHOLD: 9,
}));

jest.mock('@/components', () => ({
  Badge: ({ label }: { label: string }) => <span data-testid="badge">{label}</span>,
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const makeFlight = (overrides: Partial<Flight> = {}): Flight => ({
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
  ...overrides,
});

describe('FlightOptionItem', () => {
  it('renders airline name and flight number', () => {
    render(<FlightOptionItem flight={makeFlight()} isSelected={false} />);
    expect(screen.getByText(/Vietnam Airlines/)).toBeInTheDocument();
    expect(screen.getByText(/VN100/)).toBeInTheDocument();
  });

  it('renders departure and arrival times', () => {
    render(<FlightOptionItem flight={makeFlight()} isSelected={false} />);
    // formatTime returns HH:mm part: '08:00' and '10:00'
    expect(screen.getByText(/08:00/)).toBeInTheDocument();
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
  });

  it('shows "Direct" for stops=0', () => {
    render(<FlightOptionItem flight={makeFlight({ stops: 0 })} isSelected={false} />);
    expect(screen.getByText('Direct')).toBeInTheDocument();
  });

  it('shows stop count for stops>0', () => {
    render(<FlightOptionItem flight={makeFlight({ stops: 1 })} isSelected={false} />);
    expect(screen.getByText('1 stop')).toBeInTheDocument();
  });

  it('shows plural "stops" for stops > 1', () => {
    render(<FlightOptionItem flight={makeFlight({ stops: 2 })} isSelected={false} />);
    expect(screen.getByText('2 stops')).toBeInTheDocument();
  });

  it('shows low-seats warning when seatsAvailable <= threshold (9)', () => {
    render(<FlightOptionItem flight={makeFlight({ seatsAvailable: 5 })} isSelected={false} />);
    expect(screen.getByText(/5 seats left/)).toBeInTheDocument();
  });

  it('does not show low-seats warning when seatsAvailable > threshold', () => {
    render(<FlightOptionItem flight={makeFlight({ seatsAvailable: 10 })} isSelected={false} />);
    expect(screen.queryByText(/seats left/)).not.toBeInTheDocument();
  });

  it('renders Select button when onSelect is provided', () => {
    render(<FlightOptionItem flight={makeFlight()} isSelected={false} onSelect={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Select' })).toBeInTheDocument();
  });

  it('calls onSelect with flight id when Select is clicked', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();

    render(<FlightOptionItem flight={makeFlight()} isSelected={false} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'Select' }));
    expect(onSelect).toHaveBeenCalledWith('f1');
  });

  it('shows "Selected" text when isSelected is true', () => {
    render(<FlightOptionItem flight={makeFlight()} isSelected={true} onSelect={jest.fn()} />);
    expect(screen.getByText('Selected')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Select' })).not.toBeInTheDocument();
  });

  it('does not show Select button when onSelect is not provided', () => {
    render(<FlightOptionItem flight={makeFlight()} isSelected={false} />);
    expect(screen.queryByRole('button', { name: 'Select' })).not.toBeInTheDocument();
  });

  it('renders badge when badge prop is provided', () => {
    render(<FlightOptionItem flight={makeFlight()} isSelected={false} badge="Best price" />);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
    expect(screen.getByText('Best price')).toBeInTheDocument();
  });

  it('does not render badge when badge prop is not provided', () => {
    render(<FlightOptionItem flight={makeFlight()} isSelected={false} />);
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  it('renders price', () => {
    render(<FlightOptionItem flight={makeFlight()} isSelected={false} />);
    expect(screen.getByText(/USD 200/)).toBeInTheDocument();
  });
});
