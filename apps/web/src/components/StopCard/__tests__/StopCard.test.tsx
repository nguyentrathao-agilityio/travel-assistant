import { render, screen } from '@testing-library/react';
import { StopCard } from '../index';
import type { LandmarkStop, TravelLeg } from '@repo/types';

jest.mock('@/components', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LegConnector: ({ leg }: { leg: { transport: string } }) => (
    <div data-testid="leg-connector">{leg.transport}</div>
  ),
  StepBadge: ({ index }: { index: number }) => <span data-testid="step-badge">{index}</span>,
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

jest.mock(
  './LocalTipsDrawer',
  () => ({
    LocalTipsDrawer: () => <div data-testid="tips-drawer" />,
  }),
  { virtual: true }
);

jest.mock('@/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
  toMapsUrl: (lat?: number, lng?: number) =>
    lat !== undefined && lng !== undefined ? `https://maps?q=${lat},${lng}` : null,
}));

const makeStop = (overrides: Partial<LandmarkStop> = {}): LandmarkStop => ({
  name: 'Marble Mountains',
  city: 'Da Nang',
  description: 'Beautiful marble formations',
  visitDurationMin: 90,
  openingHours: '7am – 5pm',
  entranceFee: 40000,
  lat: 16.0,
  lng: 108.2,
  ...overrides,
});

const formatDuration = (min: number) => `${min}m`;

describe('StopCard', () => {
  describe('rendering', () => {
    it('renders the stop name', () => {
      render(<StopCard stop={makeStop()} index={1} formatDuration={formatDuration} />);
      expect(screen.getByText('Marble Mountains')).toBeInTheDocument();
    });

    it('renders the step badge with the correct index', () => {
      render(<StopCard stop={makeStop()} index={3} formatDuration={formatDuration} />);
      expect(screen.getByTestId('step-badge')).toHaveTextContent('3');
    });

    it('renders the description when provided', () => {
      render(<StopCard stop={makeStop()} index={1} formatDuration={formatDuration} />);
      expect(screen.getByText('Beautiful marble formations')).toBeInTheDocument();
    });

    it('renders the visit duration', () => {
      render(<StopCard stop={makeStop()} index={1} formatDuration={formatDuration} />);
      expect(screen.getByText('~90m')).toBeInTheDocument();
    });

    it('renders opening hours when provided', () => {
      render(<StopCard stop={makeStop()} index={1} formatDuration={formatDuration} />);
      expect(screen.getByText('7am – 5pm')).toBeInTheDocument();
    });

    it('renders entrance fee when provided', () => {
      render(<StopCard stop={makeStop()} index={1} formatDuration={formatDuration} />);
      expect(screen.getByText('40,000')).toBeInTheDocument();
    });

    it('does not render fee section when entranceFee is 0 (falsy guard in JSX)', () => {
      render(
        <StopCard stop={makeStop({ entranceFee: 0 })} index={1} formatDuration={formatDuration} />
      );
      expect(screen.queryByText('Free entry')).not.toBeInTheDocument();
    });

    it('renders map link when lat/lng are provided', () => {
      render(<StopCard stop={makeStop()} index={1} formatDuration={formatDuration} />);
      const link = screen.getByRole('link', { name: /map/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://maps?q=16,108.2');
    });

    it('does not render map link when lat/lng are absent', () => {
      render(
        <StopCard
          stop={makeStop({ lat: undefined, lng: undefined })}
          index={1}
          formatDuration={formatDuration}
        />
      );
      expect(screen.queryByRole('link', { name: /map/i })).not.toBeInTheDocument();
    });
  });

  describe('leg connector', () => {
    it('renders LegConnector when nextLeg is provided', () => {
      const nextLeg: TravelLeg = { transport: 'walk', durationMin: 10 };
      render(
        <StopCard stop={makeStop()} index={1} nextLeg={nextLeg} formatDuration={formatDuration} />
      );
      expect(screen.getByTestId('leg-connector')).toBeInTheDocument();
    });

    it('does not render LegConnector when nextLeg is absent', () => {
      render(<StopCard stop={makeStop()} index={1} formatDuration={formatDuration} />);
      expect(screen.queryByTestId('leg-connector')).not.toBeInTheDocument();
    });
  });

  describe('optional fields', () => {
    it('does not render description when absent', () => {
      render(
        <StopCard
          stop={makeStop({ description: undefined })}
          index={1}
          formatDuration={formatDuration}
        />
      );
      expect(screen.queryByText('Beautiful marble formations')).not.toBeInTheDocument();
    });

    it('does not render opening hours when absent', () => {
      render(
        <StopCard
          stop={makeStop({ openingHours: undefined })}
          index={1}
          formatDuration={formatDuration}
        />
      );
      expect(screen.queryByText('7am – 5pm')).not.toBeInTheDocument();
    });
  });
});
