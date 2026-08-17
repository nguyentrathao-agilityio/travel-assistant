import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouteConfirmCard } from '../RouteConfirmCard';
import type { RouteConfirmArgs } from '../RouteConfirmCard';

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
  ROUTE_MAX_STOPS_OPTIONS: [
    { value: '3', label: '3 stops' },
    { value: '5', label: '5 stops' },
    { value: '7', label: '7 stops' },
  ],
  ROUTE_DEFAULT_MAX_STOPS: 5,
}));

jest.mock('@/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

const defaultArgs: RouteConfirmArgs = {
  city: 'Da Nang',
  maxStops: 5,
};

describe('RouteConfirmCard', () => {
  it('renders "Plan route" title', () => {
    render(<RouteConfirmCard {...defaultArgs} />);
    expect(screen.getByText('Plan route')).toBeInTheDocument();
  });

  it('renders city field with initial value', () => {
    render(<RouteConfirmCard {...defaultArgs} />);
    expect(screen.getByDisplayValue('Da Nang')).toBeInTheDocument();
  });

  it('calls onConfirm with city and maxStops when confirmed', async () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();

    render(<RouteConfirmCard {...defaultArgs} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: /plan route/i }));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'Da Nang', maxStops: 5 })
    );
  });

  it('calls onConfirm with updated city when city is changed', async () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();

    render(<RouteConfirmCard {...defaultArgs} onConfirm={onConfirm} />);
    const cityInput = screen.getByDisplayValue('Da Nang');

    await user.clear(cityInput);
    await user.type(cityInput, 'Hoi An');
    await user.click(screen.getByRole('button', { name: /plan route/i }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ city: 'Hoi An' }));
  });

  it('calls onConfirm with updated maxStops when stop chip is selected', async () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();

    render(<RouteConfirmCard {...defaultArgs} onConfirm={onConfirm} />);
    await user.click(screen.getByTestId('chip-3'));
    await user.click(screen.getByRole('button', { name: /plan route/i }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ maxStops: 3 }));
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();

    render(<RouteConfirmCard {...defaultArgs} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
