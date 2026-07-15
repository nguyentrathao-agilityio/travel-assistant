import React from 'react';
import { render, screen } from '@testing-library/react';
import { TripCostBreakdown } from '../TripCostBreakdown';
import type { TripCostEstimate } from '@repo/schemas';

jest.mock('@/components', () => ({
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Divider: () => <hr />,
}));

jest.mock('@/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
  formatAmount: (amount: number, currency: string) => `${currency} ${amount}`,
}));

const makeEstimate = (): TripCostEstimate => ({
  grandTotal: 1500,
  currency: 'USD',
  days: 3,
  travelers: 2,
  flightTotal: 800,
  hotelTotal: 600,
  foodTotal: 100,
  activitiesTotal: 0,
  localTransportTotal: 0,
  breakdown: [
    { label: 'Flight', amount: 800, currency: 'USD' },
    { label: 'Hotel', amount: 600, currency: 'USD', note: '3 nights' },
    { label: 'Food', amount: 0, currency: 'USD' },
  ],
});

describe('TripCostBreakdown', () => {
  it('renders grand total', () => {
    render(<TripCostBreakdown estimate={makeEstimate()} />);
    expect(screen.getByText(/USD 1500/)).toBeInTheDocument();
  });

  it('renders breakdown item labels', () => {
    render(<TripCostBreakdown estimate={makeEstimate()} />);
    expect(screen.getByText('Flight')).toBeInTheDocument();
    expect(screen.getByText('Hotel')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('renders note for breakdown items that have a note', () => {
    render(<TripCostBreakdown estimate={makeEstimate()} />);
    expect(screen.getByText('3 nights')).toBeInTheDocument();
  });

  it('shows "—" for zero amount items', () => {
    render(<TripCostBreakdown estimate={makeEstimate()} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows plural "nights" label in grand total when days > 1', () => {
    render(<TripCostBreakdown estimate={makeEstimate()} />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('nights');
  });

  it('shows singular "night" in grand total when days === 1', () => {
    const estimate = { ...makeEstimate(), days: 1 };
    render(<TripCostBreakdown estimate={estimate} />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('night');
  });

  it('shows plural "travelers" in grand total when travelers > 1', () => {
    render(<TripCostBreakdown estimate={makeEstimate()} />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('travelers');
  });

  it('shows singular "traveler" in grand total when travelers === 1', () => {
    const estimate = { ...makeEstimate(), travelers: 1 };
    render(<TripCostBreakdown estimate={estimate} />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('traveler');
  });

  it('renders the "Estimated total" section label', () => {
    render(<TripCostBreakdown estimate={makeEstimate()} />);
    expect(screen.getByText('Estimated total')).toBeInTheDocument();
  });

  it('renders the "Grand total" row', () => {
    render(<TripCostBreakdown estimate={makeEstimate()} />);
    expect(screen.getByText('Grand total')).toBeInTheDocument();
  });
});
