import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from '../index';

const filters = [
  { value: 'all', label: 'All' },
  { value: 'departure', label: 'Departure', count: 3 },
  { value: 'return', label: 'Return', count: 2 },
];

describe('FilterBar', () => {
  describe('rendering', () => {
    it('renders all filter chips', () => {
      render(<FilterBar filters={filters} activeFilter="all" onChange={jest.fn()} />);
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Departure')).toBeInTheDocument();
      expect(screen.getByText('Return')).toBeInTheDocument();
    });

    it('renders as a group', () => {
      render(<FilterBar filters={filters} activeFilter="all" onChange={jest.fn()} />);
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('applies additional className', () => {
      render(
        <FilterBar filters={filters} activeFilter="all" onChange={jest.fn()} className="my-class" />
      );
      expect(screen.getByRole('group')).toHaveClass('my-class');
    });

    it('renders empty when no filters provided', () => {
      render(<FilterBar filters={[]} activeFilter="" onChange={jest.fn()} />);
      expect(screen.getByRole('group')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onChange with the selected filter value', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(<FilterBar filters={filters} activeFilter="all" onChange={onChange} />);
      await user.click(screen.getByText('Departure'));
      expect(onChange).toHaveBeenCalledWith('departure');
    });

    it('calls onChange when a different chip is clicked', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(<FilterBar filters={filters} activeFilter="departure" onChange={onChange} />);
      await user.click(screen.getByText('Return'));
      expect(onChange).toHaveBeenCalledWith('return');
    });
  });
});
