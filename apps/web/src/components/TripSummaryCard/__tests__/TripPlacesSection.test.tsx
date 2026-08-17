import React from 'react';
import { render, screen } from '@testing-library/react';
import { TripPlacesSection } from '../TripPlacesSection';
import type { PlacesSearchResult } from '@repo/schemas';

jest.mock('@/components', () => ({
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  PlaceItem: ({ place }: { place: { id: string; name: string } }) => (
    <div data-testid="place-item">{place.name}</div>
  ),
}));

jest.mock('@/utils', () => ({ cn: (...args: string[]) => args.filter(Boolean).join(' ') }));

const makePlace = (id: string, name: string) => ({
  id,
  shortCode: id.toUpperCase(),
  name,
  city: 'Da Nang',
  country: 'Vietnam',
  category: 'attraction' as const,
  description: `${name} description`,
  address: '1 Main St',
  rating: 4.5,
  reviewCount: 100,
  priceLevel: 1,
  imageUrl: '',
  tags: [],
  isRecommended: true,
});

const makePlacesResult = (count: number, total = count): PlacesSearchResult => ({
  total,
  results: Array.from({ length: count }, (_, i) => makePlace(`p${i + 1}`, `Place ${i + 1}`)),
});

describe('TripPlacesSection', () => {
  it('returns null when no places provided', () => {
    const { container } = render(<TripPlacesSection />);

    expect(container.firstChild).toBeNull();
  });

  it('returns null when places results are empty', () => {
    const { container } = render(<TripPlacesSection places={{ total: 0, results: [] }} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders place items', () => {
    render(<TripPlacesSection places={makePlacesResult(3)} />);
    expect(screen.getAllByTestId('place-item')).toHaveLength(3);
    expect(screen.getByText('Place 1')).toBeInTheDocument();
  });

  it('shows total count', () => {
    render(<TripPlacesSection places={makePlacesResult(3, 15)} />);
    expect(screen.getByText('3 total')).toBeInTheDocument();
  });

  it('limits displayed places to 6', () => {
    render(<TripPlacesSection places={makePlacesResult(10, 10)} />);
    expect(screen.getAllByTestId('place-item')).toHaveLength(6);
  });

  it('renders all places when count <= 6', () => {
    render(<TripPlacesSection places={makePlacesResult(4)} />);
    expect(screen.getAllByTestId('place-item')).toHaveLength(4);
  });
});
