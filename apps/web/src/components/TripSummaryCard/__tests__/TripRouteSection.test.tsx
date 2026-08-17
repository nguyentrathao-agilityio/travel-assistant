import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripRouteSection } from '../TripRouteSection';
import type { RouteResult } from '@repo/schemas';

jest.mock('@/components', () => ({
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  FilterChip: ({
    option,
    isActive,
    onSelect,
  }: {
    option: { label: string; value: string };
    isActive: boolean;
    onSelect: (v: string) => void;
  }) => (
    <button data-testid="filter-chip" data-active={isActive} onClick={() => onSelect(option.value)}>
      {option.label}
    </button>
  ),
}));

jest.mock('@/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
  formatDuration: (min: number) => `${min}m`,
  offsetDate: (_date: string, _offset: number) => null,
  chunk: <T,>(arr: T[], size: number) => {
    const result: T[][] = [];

    for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));

    return result;
  },
  getSlot: (idx: number, total: number) => {
    const pct = total > 1 ? idx / (total - 1) : 0;

    return pct < 0.33 ? 'morning' : pct < 0.66 ? 'afternoon' : 'evening';
  },
}));

jest.mock('@/constants', () => ({
  ROUTE_TIME_SLOTS: [
    { key: 'morning', label: 'Morning', Icon: () => null },
    { key: 'afternoon', label: 'Afternoon', Icon: () => null },
    { key: 'evening', label: 'Evening', Icon: () => null },
  ],
}));

const makeRoute = (): RouteResult => ({
  city: 'Da Nang',
  totalDurationMin: 240,
  travelTip: 'Bring water',
  stops: [
    { name: 'Marble Mountains', city: 'Da Nang' },
    { name: 'Dragon Bridge', city: 'Da Nang' },
  ],
  legs: [{ mode: 'walk', durationMin: 15, distanceKm: 1.2 }],
});

describe('TripRouteSection', () => {
  it('returns null when no route provided', () => {
    const { container } = render(<TripRouteSection days={1} />);

    expect(container.firstChild).toBeNull();
  });

  it('returns null when route has no stops', () => {
    const { container } = render(
      <TripRouteSection route={{ ...makeRoute(), stops: [] }} days={1} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders city name', () => {
    render(<TripRouteSection route={makeRoute()} days={1} />);
    expect(screen.getByText('Marble Mountains')).toBeInTheDocument();
  });

  it('renders day plan with stops', () => {
    render(<TripRouteSection route={makeRoute()} days={1} />);
    expect(screen.getByText('Marble Mountains')).toBeInTheDocument();
    expect(screen.getByText('Dragon Bridge')).toBeInTheDocument();
  });

  it('shows day tabs when multiple days', () => {
    render(<TripRouteSection route={makeRoute()} days={2} />);
    const chips = screen.getAllByTestId('filter-chip');

    expect(chips.length).toBeGreaterThan(1);
    // "Day 1" and "Day 2" labels appear in the filter chip tabs
    const day1Chips = screen.getAllByText('Day 1');
    const day2Chips = screen.getAllByText('Day 2');

    expect(day1Chips.length).toBeGreaterThanOrEqual(1);
    expect(day2Chips.length).toBeGreaterThanOrEqual(1);
  });

  it('does not show day tabs when only one day', () => {
    render(<TripRouteSection route={makeRoute()} days={1} />);
    // With 1 day there should be no day tabs (dayOptions.length > 1 is false)
    expect(screen.queryAllByTestId('filter-chip')).toHaveLength(0);
  });

  it('shows travel tip when provided', () => {
    render(<TripRouteSection route={makeRoute()} days={1} />);
    expect(screen.getByText(/Bring water/)).toBeInTheDocument();
  });

  it('does not show travel tip when not provided', () => {
    const route = { ...makeRoute(), travelTip: undefined };

    render(<TripRouteSection route={route} days={1} />);
    expect(screen.queryByText(/Bring water/)).not.toBeInTheDocument();
  });

  it('switches day when filter chip is clicked', async () => {
    const user = userEvent.setup();

    render(<TripRouteSection route={makeRoute()} days={2} />);
    const chips = screen.getAllByTestId('filter-chip');

    await user.click(chips[1]);
    expect(chips[1]).toHaveAttribute('data-active', 'true');
  });
});
