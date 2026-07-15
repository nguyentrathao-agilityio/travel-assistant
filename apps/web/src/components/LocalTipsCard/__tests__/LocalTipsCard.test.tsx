import { render, screen } from '@testing-library/react';
import { LocalTipsCard } from '../index';
import type { TipsResult } from '@repo/types';

const makeTipsData = (overrides: Partial<TipsResult> = {}): TipsResult => ({
  city: 'Da Nang',
  country: 'Vietnam',
  count: 2,
  summary: 'Essential tips for your visit.',
  tips: [
    {
      id: 't1',
      category: 'transport',
      scope: 'city',
      title: 'Use Grab',
      content: 'Grab is the best way to get around.',
      isEssential: true,
    },
    {
      id: 't2',
      category: 'food',
      scope: 'city',
      title: 'Try Banh Mi',
      content: 'Local banh mi shops are excellent.',
      isEssential: false,
    },
  ],
  ...overrides,
});

describe('LocalTipsCard', () => {
  describe('rendering', () => {
    it('renders the city in the header', () => {
      render(<LocalTipsCard data={makeTipsData()} />);
      expect(screen.getByText('Local tips: Da Nang')).toBeInTheDocument();
    });

    it('renders "Local tips" without city when city is absent', () => {
      render(<LocalTipsCard data={makeTipsData({ city: undefined })} />);
      expect(screen.getByText('Local tips')).toBeInTheDocument();
    });

    it('renders the tip count', () => {
      render(<LocalTipsCard data={makeTipsData()} />);
      expect(screen.getByText('2 tips')).toBeInTheDocument();
    });

    it('renders the summary', () => {
      render(<LocalTipsCard data={makeTipsData()} />);
      expect(screen.getByText('Essential tips for your visit.')).toBeInTheDocument();
    });

    it('renders all tip titles', () => {
      render(<LocalTipsCard data={makeTipsData()} />);
      expect(screen.getByText('Use Grab')).toBeInTheDocument();
      expect(screen.getByText('Try Banh Mi')).toBeInTheDocument();
    });

    it('renders "essential" badge for essential tips', () => {
      render(<LocalTipsCard data={makeTipsData()} />);
      expect(screen.getByText('⭐ Essential')).toBeInTheDocument();
    });

    it('renders category badges for all tips', () => {
      render(<LocalTipsCard data={makeTipsData()} />);
      expect(screen.getByText('🚌 Transport')).toBeInTheDocument();
      expect(screen.getByText('🍜 Food')).toBeInTheDocument();
    });

    it('renders tip content text', () => {
      render(<LocalTipsCard data={makeTipsData()} />);
      expect(screen.getByText('Grab is the best way to get around.')).toBeInTheDocument();
    });

    it('renders without data (no crash)', () => {
      expect(() => render(<LocalTipsCard />)).not.toThrow();
    });

    it('applies additional className', () => {
      const { container } = render(<LocalTipsCard data={makeTipsData()} className="custom" />);
      expect(container.querySelector('.custom')).toBeInTheDocument();
    });
  });
});
