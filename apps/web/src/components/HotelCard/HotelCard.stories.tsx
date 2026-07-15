import type { Meta, StoryObj } from '@storybook/react';

import { HotelCard } from './index';
import type { HotelSearchResult } from '@repo/types';

const meta: Meta<typeof HotelCard> = {
  title: 'Components/HotelCard',
  component: HotelCard,
  tags: ['autodocs'],
  argTypes: {
    onSelect: { action: 'select' },
  },
};

export default meta;
type Story = StoryObj<typeof HotelCard>;

const sampleData: HotelSearchResult = {
  total: 3,
  results: [
    {
      id: 'hotel-1',
      shortCode: 'HA1',
      name: 'Harbor Inn',
      city: 'San Francisco',
      country: 'USA',
      address: '123 Bay St',
      starRating: 4,
      pricePerNight: 180,
      currency: 'USD',
      amenities: ['Free Wi-Fi', 'Breakfast included', 'Gym'],
      rating: 4.6,
      reviewCount: 128,
      available: true,
      availableRooms: 5,
      maxOccupancyPerRoom: 2,
      nights: 3,
      totalPrice: 540,
    },
    {
      id: 'hotel-2',
      shortCode: 'HR2',
      name: 'Riverside Retreat',
      city: 'San Francisco',
      country: 'USA',
      address: '420 River Rd',
      starRating: 5,
      pricePerNight: 320,
      currency: 'USD',
      amenities: ['Pool', 'Spa', 'Complimentary parking'],
      rating: 4.9,
      reviewCount: 214,
      available: true,
      availableRooms: 2,
      maxOccupancyPerRoom: 4,
      nights: 3,
      totalPrice: 960,
    },
    {
      id: 'hotel-3',
      shortCode: 'CT3',
      name: 'City Center Suites',
      city: 'San Francisco',
      country: 'USA',
      address: '89 Market St',
      starRating: 3,
      pricePerNight: 110,
      currency: 'USD',
      amenities: ['Free Wi-Fi', '24/7 front desk'],
      rating: 4.2,
      reviewCount: 84,
      available: false,
      availableRooms: 0,
      maxOccupancyPerRoom: 2,
      nights: 3,
      totalPrice: 330,
    },
  ],
};

export const Default: Story = {
  args: {
    data: sampleData,
    city: 'San Francisco',
    checkIn: '2026-07-10',
    checkOut: '2026-07-13',
    onSelect: () => {},
  },
};

export const Loading: Story = {
  args: {
    data: { total: 0, results: [] },
    city: 'San Francisco',
  },
};

export const SelectedHotel: Story = {
  args: {
    data: sampleData,
    city: 'San Francisco',
    checkIn: '2026-07-10',
    checkOut: '2026-07-13',
    onSelect: () => {},
    initialHotel: sampleData.results[0],
  },
};

export const EmptyResults: Story = {
  args: {
    data: {
      total: 0,
      results: [],
    },
    city: 'San Francisco',
    checkIn: '2026-07-10',
    checkOut: '2026-07-13',
    onSelect: () => {},
  },
};
