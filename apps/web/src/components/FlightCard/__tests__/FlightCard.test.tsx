import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlightCard } from '../index';
import type { Flight, FlightSearchResult } from '@repo/types';

jest.mock('../FlightOptionItem', () => ({
  FlightOptionItem: ({
    flight,
    isSelected,
    onSelect,
  }: {
    flight: Flight;
    isSelected: boolean;
    onSelect?: (id: string) => void;
  }) => (
    <button
      data-testid="flight-option"
      data-selected={isSelected}
      onClick={() => onSelect?.(flight.id)}
    >
      {flight.flightNumber}
    </button>
  ),
}));

const makeFlight = (id: string, flightNumber: string, price = 200): Flight => ({
  id,
  airline: { code: 'VN', name: 'Vietnam Airlines' },
  flightNumber,
  origin: 'HAN',
  destination: 'SGN',
  departureTime: '2026-07-01T08:00:00Z',
  arrivalTime: '2026-07-01T10:00:00Z',
  durationMinutes: 120,
  price,
  currency: 'USD',
  seatsAvailable: 10,
  stops: 0,
});

const makeData = (overrides: Partial<FlightSearchResult> = {}): FlightSearchResult => ({
  count: 2,
  results: [makeFlight('f1', 'VN100'), makeFlight('f2', 'VN200', 250)],
  ...overrides,
});

describe('FlightCard', () => {
  describe('loading / empty states', () => {
    it('renders without crashing when data is provided', () => {
      const { container } = render(<FlightCard data={makeData()} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders flight list when data is defined', () => {
      const { container } = render(<FlightCard data={makeData()} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('with data', () => {
    it('renders flight count', () => {
      render(<FlightCard data={makeData()} origin="HAN" destination="SGN" />);
      expect(screen.getByText('2 flights found')).toBeInTheDocument();
    });

    it('renders origin and destination in header', () => {
      const { container } = render(<FlightCard data={makeData()} origin="HAN" destination="SGN" />);
      // origin + destination share a Typography element with an icon between them
      expect(container.textContent).toContain('HAN');
      expect(container.textContent).toContain('SGN');
    });

    it('renders a FlightOptionItem for each departure flight', () => {
      render(<FlightCard data={makeData()} />);
      expect(screen.getAllByTestId('flight-option')).toHaveLength(2);
    });

    it('renders empty state when results list is empty', () => {
      render(<FlightCard data={makeData({ count: 0, results: [] })} />);
      expect(screen.getByText('No flights found for this route.')).toBeInTheDocument();
    });

    it('shows singular "flight found" when count is 1', () => {
      render(<FlightCard data={makeData({ count: 1, results: [makeFlight('f1', 'VN100')] })} />);
      expect(screen.getByText('1 flight found')).toBeInTheDocument();
    });
  });

  describe('selection and confirm banner', () => {
    it('shows confirm banner after selecting a departure flight (one-way)', async () => {
      const user = userEvent.setup();
      render(<FlightCard data={makeData()} onSelect={jest.fn()} />);
      await user.click(screen.getAllByTestId('flight-option')[0]);
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });

    it('calls onSelect when the confirm button is clicked', async () => {
      const onSelect = jest.fn();
      const user = userEvent.setup();
      render(<FlightCard data={makeData()} onSelect={onSelect} />);
      await user.click(screen.getAllByTestId('flight-option')[0]);
      await user.click(screen.getByRole('button', { name: /confirm/i }));
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'f1' }), 'departure');
    });

    it('hides confirm banner and clears selection when Change is clicked', async () => {
      const user = userEvent.setup();
      render(<FlightCard data={makeData()} onSelect={jest.fn()} />);
      await user.click(screen.getAllByTestId('flight-option')[0]);
      await user.click(screen.getByRole('button', { name: /change/i }));
      expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument();
    });
  });

  describe('return flights tab', () => {
    it('renders departure/return tabs when returnResults are provided', () => {
      render(
        <FlightCard
          data={makeData({ returnResults: [makeFlight('r1', 'VN300')], returnCount: 1 })}
        />
      );
      expect(screen.getByText('Departure')).toBeInTheDocument();
      expect(screen.getByText('Return')).toBeInTheDocument();
    });
  });
});
