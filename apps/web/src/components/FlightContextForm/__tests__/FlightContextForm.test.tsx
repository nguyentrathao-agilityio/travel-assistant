import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlightContextForm } from '../index';
import type { FlightArgs } from '@/types';

const baseArgs: FlightArgs = {
  origin: undefined,
  destination: undefined,
  departure_date: undefined,
  adults: undefined,
  return_date: undefined,
  airline: undefined,
  max_price: undefined,
  max_stops: undefined,
  sort: undefined,
};

const onConfirm = jest.fn();
const onCancel = jest.fn();

beforeEach(() => {
  onConfirm.mockClear();
  onCancel.mockClear();
});

describe('FlightContextForm', () => {
  describe('rendering', () => {
    it('renders the "Search flights" title', () => {
      render(<FlightContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} />);
      // title <p> and submit button both contain "Search flights" — use getAllByText
      expect(screen.getAllByText('Search flights').length).toBeGreaterThanOrEqual(1);
    });

    it('renders required fields when they are missing from args', () => {
      render(<FlightContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} />);
      expect(screen.getByPlaceholderText('e.g. SGN, HAN')).toBeInTheDocument();
      // departure_date and return_date both use YYYY-MM-DD placeholder — use getAllBy
      expect(screen.getAllByPlaceholderText('YYYY-MM-DD').length).toBeGreaterThanOrEqual(1);
    });

    it('does not render required fields when already provided in args', () => {
      const args: FlightArgs = { ...baseArgs, destination: 'SGN', departure_date: '2026-07-01' };
      render(<FlightContextForm args={args} onConfirm={onConfirm} onCancel={onCancel} />);
      expect(screen.queryByPlaceholderText('e.g. SGN, HAN')).not.toBeInTheDocument();
    });

    it('renders the cancel and submit buttons', () => {
      render(<FlightContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} />);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Search flights' })).toBeInTheDocument();
    });

    it('submit button is disabled when required fields are empty', () => {
      render(<FlightContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} />);
      expect(screen.getByRole('button', { name: 'Search flights' })).toBeDisabled();
    });

    it('returns null when disabled prop is true', () => {
      const { container } = render(
        <FlightContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} disabled />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('interactions', () => {
    it('enables submit once all required fields are filled', async () => {
      const user = userEvent.setup();
      render(<FlightContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} />);
      await user.type(screen.getByPlaceholderText('e.g. SGN, HAN'), 'SGN');
      await user.type(screen.getAllByPlaceholderText('YYYY-MM-DD')[0], '2026-07-01');
      expect(screen.getByRole('button', { name: 'Search flights' })).toBeEnabled();
    });

    it('calls onConfirm with merged args when submitted', async () => {
      const user = userEvent.setup();
      render(<FlightContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} />);
      await user.type(screen.getByPlaceholderText('e.g. SGN, HAN'), 'SGN');
      await user.type(screen.getAllByPlaceholderText('YYYY-MM-DD')[0], '2026-07-01');
      await user.click(screen.getByRole('button', { name: 'Search flights' }));
      expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ destination: 'SGN' }));
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<FlightContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} />);
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('hides the form after submit', async () => {
      const user = userEvent.setup();
      render(<FlightContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} />);
      await user.type(screen.getByPlaceholderText('e.g. SGN, HAN'), 'SGN');
      await user.type(screen.getAllByPlaceholderText('YYYY-MM-DD')[0], '2026-07-01');
      await user.click(screen.getByRole('button', { name: 'Search flights' }));
      expect(screen.queryByText('Search flights')).not.toBeInTheDocument();
    });
  });
});
