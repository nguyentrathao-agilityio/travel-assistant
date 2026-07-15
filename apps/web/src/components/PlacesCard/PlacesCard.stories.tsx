import type { Meta, StoryObj } from '@storybook/react';

import { PlacesCard } from './index';
import type { PlaceSearchResult } from '@repo/types';

const meta: Meta<typeof PlacesCard> = {
  title: 'Components/PlacesCard',
  component: PlacesCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PlacesCard>;

const sampleData: PlaceSearchResult = {
  total: 4,
  city: 'Barcelona',
  category: 'attraction',
  results: [
    {
      id: 'place-1',
      shortCode: 'P1',
      name: 'Park Güell',
      city: 'Barcelona',
      country: 'Spain',
      category: 'attraction',
      description: 'A whimsical park with mosaics, sculptures and city views.',
      address: 'Carrer, 5',
      rating: 4.8,
      reviewCount: 34210,
      priceLevel: 2,
      openingHours: '08:00 - 21:00',
      imageUrl: 'https://example.com/park-guell.jpg',
      tags: ['architecture', 'family-friendly'],
      isRecommended: true,
    },
    {
      id: 'place-2',
      shortCode: 'P2',
      name: 'La Boqueria Market',
      city: 'Barcelona',
      country: 'Spain',
      category: 'nightlife',
      description: 'Famous food market with fresh produce and local snacks.',
      address: 'La Rambla, 91',
      rating: 4.6,
      reviewCount: 27860,
      priceLevel: 3,
      openingHours: '08:00 - 20:30',
      imageUrl: 'https://example.com/la-boqueria.jpg',
      tags: ['food', 'local'],
      isRecommended: true,
    },
  ],
};

export const Default: Story = {
  args: {
    data: sampleData,
  },
};

export const NoPlaces: Story = {
  args: {
    data: {
      total: 0,
      city: 'Barcelona',
      category: 'restaurant',
      results: [],
    },
  },
};
