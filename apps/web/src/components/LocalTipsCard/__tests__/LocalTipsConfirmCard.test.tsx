import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalTipsConfirmCard } from '../LocalTipsConfirmCard';
import type { LocalTipsConfirmArgs } from '../LocalTipsConfirmCard';

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
  TIP_CATEGORIES: {
    FOOD: 'food',
    TRANSPORT: 'transport',
    MONEY: 'money',
    SAFETY: 'safety',
    CULTURE: 'culture',
    BEST_TIME: 'best_time',
    LANGUAGE: 'language',
    CONNECTIVITY: 'connectivity',
    HEALTH: 'health',
    ETIQUETTE: 'etiquette',
  },
  TIP_CATEGORY_OPTIONS: [
    { value: 'transport', label: 'Transport' },
    { value: 'food', label: 'Food' },
    { value: 'safety', label: 'Safety' },
  ],
}));

jest.mock('@/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

const defaultArgs: LocalTipsConfirmArgs = {
  city: 'Da Nang',
  country: 'Vietnam',
  category: 'food',
  essentialOnly: false,
};

describe('LocalTipsConfirmCard', () => {
  it('renders title "Get local tips"', () => {
    render(<LocalTipsConfirmCard {...defaultArgs} />);
    expect(screen.getByText('Get local tips')).toBeInTheDocument();
  });

  it('renders city field with initial value', () => {
    render(<LocalTipsConfirmCard {...defaultArgs} />);
    expect(screen.getByDisplayValue('Da Nang')).toBeInTheDocument();
  });

  it('renders country field with initial value', () => {
    render(<LocalTipsConfirmCard {...defaultArgs} />);
    expect(screen.getByDisplayValue('Vietnam')).toBeInTheDocument();
  });

  it('calls onConfirm with updated city and country values', async () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();

    render(<LocalTipsConfirmCard {...defaultArgs} onConfirm={onConfirm} />);

    const cityInput = screen.getByDisplayValue('Da Nang');

    await user.clear(cityInput);
    await user.type(cityInput, 'Hoi An');

    await user.click(screen.getByRole('button', { name: /get tips/i }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ city: 'Hoi An' }));
  });

  it('calls onCancel when Cancel button is clicked', async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();

    render(<LocalTipsConfirmCard {...defaultArgs} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('toggles essentialOnly switch when clicked', async () => {
    const user = userEvent.setup();

    render(<LocalTipsConfirmCard {...defaultArgs} essentialOnly={false} />);
    const toggle = screen.getByRole('switch');

    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onConfirm with essentialOnly set to true after toggle', async () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();

    render(<LocalTipsConfirmCard {...defaultArgs} essentialOnly={false} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('switch'));
    await user.click(screen.getByRole('button', { name: /get tips/i }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ essentialOnly: true }));
  });
});
