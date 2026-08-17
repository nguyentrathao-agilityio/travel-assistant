import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlacesConfirmCard } from '../PlacesConfirmCard';
import type { PlacesConfirmArgs } from '../PlacesConfirmCard';

jest.mock('@/components', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  FilterChip: ({
    option,
    isActive,
    onSelect,
  }: {
    option: { label: string; value: string };
    isActive: boolean;
    onSelect: (v: string) => void;
  }) => (
    <button
      data-testid={`chip-${option.value}`}
      data-active={isActive}
      onClick={() => onSelect(option.value)}
    >
      {option.label}
    </button>
  ),
  Input: ({
    value,
    onChange,
    label,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    label?: string;
    placeholder?: string;
  }) => (
    <div>
      {label && <label>{label}</label>}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  ),
}));

jest.mock('@/constants', () => ({
  PLACES_CATEGORY_FILTERS: [
    { value: 'attraction', label: 'Attraction' },
    { value: 'restaurant', label: 'Restaurant' },
  ],
  PLACE_FILTER_VALUES: { ATTRACTION: 'attraction' },
  PRICE_OPTIONS: [
    { value: '0', label: 'Any' },
    { value: '1', label: '$' },
    { value: '2', label: '$$' },
  ],
}));

jest.mock('@/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

const defaultArgs: PlacesConfirmArgs = {
  city: 'Da Nang',
  category: 'attraction',
  priceLevel: 0,
};

describe('PlacesConfirmCard', () => {
  it('renders "Search places" title', () => {
    render(<PlacesConfirmCard {...defaultArgs} />);
    const matches = screen.getAllByText('Search places');

    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders city field with initial value', () => {
    render(<PlacesConfirmCard {...defaultArgs} />);
    expect(screen.getByDisplayValue('Da Nang')).toBeInTheDocument();
  });

  it('calls onConfirm with city when confirmed', async () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();

    render(<PlacesConfirmCard {...defaultArgs} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: /search places/i }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ city: 'Da Nang' }));
  });

  it('calls onConfirm with updated city after typing', async () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();

    render(<PlacesConfirmCard {...defaultArgs} onConfirm={onConfirm} />);
    const cityInput = screen.getByDisplayValue('Da Nang');

    await user.clear(cityInput);
    await user.type(cityInput, 'Hoi An');
    await user.click(screen.getByRole('button', { name: /search places/i }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ city: 'Hoi An' }));
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();

    render(<PlacesConfirmCard {...defaultArgs} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
