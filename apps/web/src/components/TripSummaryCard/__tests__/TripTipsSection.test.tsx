import React from 'react';
import { render, screen } from '@testing-library/react';
import { TripTipsSection } from '../TripTipsSection';
import type { TipsResult } from '@repo/schemas';

jest.mock('@/components', () => ({
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

jest.mock('@/utils', () => ({ cn: (...args: string[]) => args.filter(Boolean).join(' ') }));

jest.mock('@/constants', () => ({
  TIP_CATEGORY_CLASS_MAP: {
    transport: 'bg-badge-primary-bg text-badge-primary-text',
    money: 'bg-badge-warning-bg text-badge-warning-text',
    safety: 'bg-badge-success-bg text-badge-success-text',
    culture: 'bg-badge-accent-bg text-badge-accent-text',
    food: 'bg-badge-danger-bg text-badge-danger-text',
    connectivity: 'bg-badge-secondary-bg text-badge-secondary-text',
    health: 'bg-badge-secondary-bg text-badge-secondary-text',
    etiquette: 'bg-badge-accent-bg text-badge-accent-text',
    best_time: 'bg-badge-warning-bg text-badge-warning-text',
    language: 'bg-badge-accent-bg text-badge-accent-text',
  },
}));

const makeTip = (
  id: string,
  title: string,
  isEssential: boolean,
  category: TipsResult['tips'][0]['category'] = 'food'
): TipsResult['tips'][0] => ({
  id,
  category,
  scope: 'city',
  title,
  content: `Content for ${title}`,
  isEssential,
  location: null,
});

describe('TripTipsSection', () => {
  it('returns null when no tips provided', () => {
    const { container } = render(<TripTipsSection />);

    expect(container.firstChild).toBeNull();
  });

  it('returns null when tips array is empty', () => {
    const { container } = render(
      <TripTipsSection tips={{ country: 'Vietnam', count: 0, summary: '', tips: [] }} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows essential tips preferentially', () => {
    const tips: TipsResult = {
      country: 'Vietnam',
      count: 3,
      summary: '',
      tips: [
        makeTip('t1', 'Essential Tip 1', true, 'transport'),
        makeTip('t2', 'Essential Tip 2', true, 'food'),
        makeTip('t3', 'Non-Essential Tip', false, 'money'),
      ],
    };

    render(<TripTipsSection tips={tips} />);
    expect(screen.getByText('Essential Tip 1')).toBeInTheDocument();
    expect(screen.getByText('Essential Tip 2')).toBeInTheDocument();
    expect(screen.queryByText('Non-Essential Tip')).not.toBeInTheDocument();
  });

  it('falls back to all tips when no essential tips exist', () => {
    const tips: TipsResult = {
      country: 'Vietnam',
      count: 2,
      summary: '',
      tips: [
        makeTip('t1', 'Regular Tip 1', false, 'food'),
        makeTip('t2', 'Regular Tip 2', false, 'transport'),
      ],
    };

    render(<TripTipsSection tips={tips} />);
    expect(screen.getByText('Regular Tip 1')).toBeInTheDocument();
    expect(screen.getByText('Regular Tip 2')).toBeInTheDocument();
  });

  it('shows category badge for each tip', () => {
    const tips: TipsResult = {
      country: 'Vietnam',
      count: 1,
      summary: '',
      tips: [makeTip('t1', 'Food Tip', true, 'food')],
    };

    render(<TripTipsSection tips={tips} />);
    expect(screen.getByText('food')).toBeInTheDocument();
  });

  it('limits to MAX_TIPS (4) tips', () => {
    const tipItems = Array.from({ length: 6 }, (_, i) =>
      makeTip(`t${i + 1}`, `Tip ${i + 1}`, true, 'food')
    );
    const tips: TipsResult = {
      country: 'Vietnam',
      count: 6,
      summary: '',
      tips: tipItems,
    };

    render(<TripTipsSection tips={tips} />);
    // Only 4 essential tips should be shown (MAX_TIPS = 4)
    const renderedTips = screen.getAllByText(/^Tip \d+$/);

    expect(renderedTips.length).toBeLessThanOrEqual(4);
  });
});
