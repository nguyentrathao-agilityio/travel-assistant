import { render, screen } from '@testing-library/react';
import { LegConnector } from '@/components/common/LegConnector';

// jest.mock is hoisted before imports, so use jest.requireActual inside the factory
jest.mock('@/constants', () => {
  const { Footprints } = jest.requireActual<typeof import('lucide-react')>('lucide-react');

  return {
    TRAVEL_TRANSPORT_MAP: {
      walk: { icon: Footprints, label: 'Walk' },
      taxi: { icon: Footprints, label: 'Taxi' },
    },
  };
});

const formatDuration = (min: number) => `${min}m`;

describe('LegConnector', () => {
  it('renders the transport label', () => {
    render(
      <LegConnector
        leg={{ transport: 'walk', durationMin: 10, distanceKm: 0.8 }}
        formatDuration={formatDuration}
      />
    );
    expect(screen.getByText('Walk')).toBeInTheDocument();
  });

  it('renders the formatted duration', () => {
    render(
      <LegConnector
        leg={{ transport: 'walk', durationMin: 15, distanceKm: 1 }}
        formatDuration={formatDuration}
      />
    );
    expect(screen.getByText('15m')).toBeInTheDocument();
  });

  it('renders distance when distanceKm > 0', () => {
    render(
      <LegConnector
        leg={{ transport: 'walk', durationMin: 10, distanceKm: 2.5 }}
        formatDuration={formatDuration}
      />
    );
    expect(screen.getByText('2.5 km')).toBeInTheDocument();
  });

  it('does not render distance when distanceKm is 0', () => {
    render(
      <LegConnector
        leg={{ transport: 'walk', durationMin: 10, distanceKm: 0 }}
        formatDuration={formatDuration}
      />
    );
    expect(screen.queryByText('km')).not.toBeInTheDocument();
  });
});
