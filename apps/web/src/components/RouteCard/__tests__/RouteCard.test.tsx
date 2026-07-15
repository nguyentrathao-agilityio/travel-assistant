import { render, screen } from '@testing-library/react';
import { RouteCard } from '../index';
import type { LandmarkTourRoute } from '@repo/types';

jest.mock('@/components', () => ({
  StopCard: ({ stop }: { stop: { name: string } }) => (
    <div data-testid="stop-card">{stop.name}</div>
  ),
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

jest.mock('@/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
  formatDuration: (min: number) => `${min} min`,
  toTravelLeg: (leg: unknown) => leg,
}));

const makeRoute = (overrides: Partial<LandmarkTourRoute> = {}): LandmarkTourRoute => ({
  city: 'Da Nang',
  totalDurationMin: 240,
  stops: [
    { name: 'Marble Mountains', city: 'Da Nang' },
    { name: 'Dragon Bridge', city: 'Da Nang' },
  ],
  legs: [{ mode: 'walk', durationMin: 15, distanceKm: 1.2 }],
  ...overrides,
});

describe('RouteCard', () => {
  describe('loading / empty states', () => {
    it('renders without crashing when data is provided', () => {
      render(<RouteCard data={makeRoute()} />);
      expect(screen.getByText('Da Nang landmark route')).toBeInTheDocument();
    });

    it('renders route card when data is defined', () => {
      render(<RouteCard data={makeRoute()} />);
      expect(screen.getByText('Da Nang landmark route')).toBeInTheDocument();
    });
  });

  describe('with data', () => {
    it('renders the city route header', () => {
      render(<RouteCard data={makeRoute()} />);
      expect(screen.getByText('Da Nang landmark route')).toBeInTheDocument();
    });

    it('renders total duration', () => {
      render(<RouteCard data={makeRoute()} />);
      expect(screen.getByText('240 min')).toBeInTheDocument();
    });

    it('renders stop count badge', () => {
      render(<RouteCard data={makeRoute()} />);
      expect(screen.getByText('2 stops')).toBeInTheDocument();
    });

    it('renders a StopCard for each stop', () => {
      render(<RouteCard data={makeRoute()} />);
      expect(screen.getAllByTestId('stop-card')).toHaveLength(2);
      expect(screen.getByText('Marble Mountains')).toBeInTheDocument();
      expect(screen.getByText('Dragon Bridge')).toBeInTheDocument();
    });

    it('renders no stop-cards when stops list is empty', () => {
      render(<RouteCard data={makeRoute({ stops: [], legs: [] })} />);
      expect(screen.queryAllByTestId('stop-card')).toHaveLength(0);
    });

    it('applies additional className', () => {
      const { container } = render(<RouteCard data={makeRoute()} className="custom" />);
      expect(container.firstChild).toHaveClass('custom');
    });
  });
});
