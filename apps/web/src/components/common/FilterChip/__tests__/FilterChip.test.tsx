import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterChip } from '@/components/common/FilterChip';
import type { FilterOption } from '@/components/common/FilterChip';

jest.mock('@/constants', () => ({}));

const baseOption: FilterOption = { value: 'all', label: 'All' };

describe('FilterChip', () => {
  it('renders the label', () => {
    render(<FilterChip option={baseOption} isActive={false} onSelect={jest.fn()} />);
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('has aria-pressed=false when inactive', () => {
    render(<FilterChip option={baseOption} isActive={false} onSelect={jest.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('has aria-pressed=true when active', () => {
    render(<FilterChip option={baseOption} isActive={true} onSelect={jest.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onSelect with the option value when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(<FilterChip option={baseOption} isActive={false} onSelect={onSelect} />);
    await user.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('all');
  });

  it('renders count badge when count is provided', () => {
    render(
      <FilterChip option={{ ...baseOption, count: 5 }} isActive={false} onSelect={jest.fn()} />
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not render count when count is undefined', () => {
    render(<FilterChip option={baseOption} isActive={false} onSelect={jest.fn()} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
