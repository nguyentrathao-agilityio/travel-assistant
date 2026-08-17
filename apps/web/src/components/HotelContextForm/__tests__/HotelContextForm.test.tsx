import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HotelContextForm } from '../index';
import type { HotelArgs } from '@/types';

const baseArgs: HotelArgs = {
  city: undefined,
  check_in: undefined,
  check_out: undefined,
  guests: undefined,
  min_rating: undefined,
  max_price: undefined,
  sort: undefined,
};

const onConfirm = jest.fn();
const onCancel = jest.fn();

beforeEach(() => {
  onConfirm.mockClear();
  onCancel.mockClear();
});

describe('HotelContextForm', () => {
  describe('rendering', () => {
    it('renders the "Search hotels" title', () => {
      render(<HotelContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} />);
      // title and submit button both contain "Search hotels" — use getAllByText
      expect(screen.getAllByText('Search hotels').length).toBeGreaterThanOrEqual(1);
    });

    it('renders required fields when missing from args', () => {
      render(<HotelContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} />);
      expect(screen.getByPlaceholderText('e.g. Paris, Tokyo')).toBeInTheDocument();
    });

    it('does not render required fields when already provided', () => {
      const args: HotelArgs = {
        ...baseArgs,
        city: 'Paris',
        check_in: '2026-07-01',
        check_out: '2026-07-07',
      };

      render(<HotelContextForm args={args} onConfirm={onConfirm} onCancel={onCancel} />);
      expect(screen.queryByPlaceholderText('e.g. Paris, Tokyo')).not.toBeInTheDocument();
    });

    it('submit button is disabled when required fields are empty', () => {
      render(<HotelContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} />);
      expect(screen.getByRole('button', { name: 'Search hotels' })).toBeDisabled();
    });

    it('renders cancel and submit buttons', () => {
      render(<HotelContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} />);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Search hotels' })).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('enables submit once required fields are filled', async () => {
      const user = userEvent.setup();

      render(<HotelContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} />);
      await user.type(screen.getByPlaceholderText('e.g. Paris, Tokyo'), 'Paris');
      await user.type(screen.getAllByPlaceholderText('YYYY-MM-DD')[0], '2026-07-01');
      await user.type(screen.getAllByPlaceholderText('YYYY-MM-DD')[1], '2026-07-07');
      expect(screen.getByRole('button', { name: 'Search hotels' })).toBeEnabled();
    });

    it('calls onConfirm with merged args on submit', async () => {
      const user = userEvent.setup();

      render(<HotelContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} />);
      await user.type(screen.getByPlaceholderText('e.g. Paris, Tokyo'), 'Paris');
      await user.type(screen.getAllByPlaceholderText('YYYY-MM-DD')[0], '2026-07-01');
      await user.type(screen.getAllByPlaceholderText('YYYY-MM-DD')[1], '2026-07-07');
      await user.click(screen.getByRole('button', { name: 'Search hotels' }));
      expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ city: 'Paris' }));
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(<HotelContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} />);
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('disables fields after submit', async () => {
      const user = userEvent.setup();

      render(<HotelContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} />);
      await user.type(screen.getByPlaceholderText('e.g. Paris, Tokyo'), 'Paris');
      await user.type(screen.getAllByPlaceholderText('YYYY-MM-DD')[0], '2026-07-01');
      await user.type(screen.getAllByPlaceholderText('YYYY-MM-DD')[1], '2026-07-07');
      await user.click(screen.getByRole('button', { name: 'Search hotels' }));
      expect(screen.getByRole('button', { name: 'Search hotels' })).toBeDisabled();
    });
  });

  describe('disabled prop', () => {
    it('disables inputs and buttons when disabled=true', () => {
      render(
        <HotelContextForm args={baseArgs} onConfirm={onConfirm} onCancel={onCancel} disabled />
      );
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });
  });
});
