import { render, screen } from '@testing-library/react';
import { PlacesCard } from '../index';
import type { PlaceSearchResult } from '@repo/types';

jest.mock('../PlaceItem', () => ({
  PlaceItem: ({ place }: { place: { name: string } }) => (
    <div data-testid="place-item">{place.name}</div>
  ),
}));

const makePlacesData = (overrides: Partial<PlaceSearchResult> = {}): PlaceSearchResult => ({
  total: 2,
  city: 'Da Nang',
  results: [
    {
      id: 'p1',
      shortCode: 'P1',
      name: 'Marble Mountains',
      city: 'Da Nang',
      country: 'Vietnam',
      category: 'attraction',
      description: 'Famous marble formation.',
      address: 'Marble St',
      rating: 4.5,
      reviewCount: 500,
      priceLevel: 1,
      imageUrl: 'https://example.com/marble.jpg',
      tags: ['nature'],
      isRecommended: true,
    },
    {
      id: 'p2',
      shortCode: 'P2',
      name: 'Dragon Bridge',
      city: 'Da Nang',
      country: 'Vietnam',
      category: 'attraction',
      description: 'Famous bridge.',
      address: 'Dragon St',
      rating: 4.7,
      reviewCount: 1000,
      priceLevel: 0,
      imageUrl: 'https://example.com/dragon.jpg',
      tags: ['iconic'],
      isRecommended: true,
    },
  ],
  ...overrides,
});

describe('PlacesCard', () => {
  describe('rendering', () => {
    it('renders the city in the header', () => {
      render(<PlacesCard data={makePlacesData()} />);
      expect(screen.getByText('Places in Da Nang')).toBeInTheDocument();
    });

    it('renders "Places" without city when city is absent', () => {
      render(<PlacesCard data={makePlacesData({ city: undefined })} />);
      expect(screen.getByText('Places')).toBeInTheDocument();
    });

    it('renders total place count', () => {
      render(<PlacesCard data={makePlacesData()} />);
      expect(screen.getByText('2 places')).toBeInTheDocument();
    });

    it('renders a PlaceItem for each result', () => {
      render(<PlacesCard data={makePlacesData()} />);
      expect(screen.getAllByTestId('place-item')).toHaveLength(2);
      expect(screen.getByText('Marble Mountains')).toBeInTheDocument();
      expect(screen.getByText('Dragon Bridge')).toBeInTheDocument();
    });

    it('renders empty state when results list is empty', () => {
      render(<PlacesCard data={makePlacesData({ results: [] })} />);
      expect(screen.getByText('No places in this category')).toBeInTheDocument();
    });

    it('renders without crashing', () => {
      expect(() => render(<PlacesCard data={makePlacesData()} />)).not.toThrow();
    });

    it('applies additional className', () => {
      const { container } = render(<PlacesCard data={makePlacesData()} className="custom" />);
      expect(container.querySelector('.custom')).toBeInTheDocument();
    });
  });
});
