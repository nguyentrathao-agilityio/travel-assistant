import type { Meta, StoryObj } from '@storybook/react';

import { TripSummaryCard } from './index';
import type { SelectedFlight, HotelAvailability } from '@repo/types';
import type { TripSummaryResult } from '@repo/schemas';

const meta: Meta<typeof TripSummaryCard> = {
  title: 'Components/TripSummaryCard',
  component: TripSummaryCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TripSummaryCard>;

const sampleData: TripSummaryResult = {
  destination: 'Tokyo',
  country: 'Japan',
  startDate: '2026-10-08',
  endDate: '2026-10-15',
  travelers: 2,
  days: 7,
  suggestedFlight: {
    id: 'fl-1',
    airline: { code: 'JL', name: 'Japan Airlines' },
    flightNumber: 'JL005',
    origin: 'SFO',
    destination: 'HND',
    departureTime: '2026-10-08T12:00:00Z',
    arrivalTime: '2026-10-09T16:00:00Z',
    durationMinutes: 660,
    price: 950,
    currency: 'USD',
    seatsAvailable: 8,
    stops: 1,
  },
  suggestedHotel: {
    id: 'hotel-1',
    shortCode: 'TK1',
    code: 'SKYLINE-TOKYO',
    name: 'Skyline Hotel Tokyo',
    city: 'Tokyo',
    country: 'Japan',
    address: '1-1 Chiyoda',
    starRating: 4,
    pricePerNight: 245,
    currency: 'USD',
    amenities: ['Free Wi-Fi', 'Breakfast', 'Spa'],
    rating: 4.6,
    reviewCount: 1240,
    imageUrl: '',
    available: true,
    availableRooms: 3,
    maxOccupancyPerRoom: 2,
    nights: 7,
    totalPrice: 1715,
  },
  route: {
    city: 'Tokyo',
    totalDurationMin: 210,
    stops: [
      {
        name: 'Senso-ji Temple',
        city: 'Tokyo',
        description: 'Ancient Buddhist temple in Asakusa.',
        visitDurationMin: 60,
        openingHours: '06:00 - 17:00',
      },
      {
        name: 'Shibuya Crossing',
        city: 'Tokyo',
        description: 'Iconic intersection with neon lights and energy.',
        visitDurationMin: 45,
        openingHours: 'Open 24 hours',
      },
      {
        name: 'Meiji Shrine',
        city: 'Tokyo',
        description: 'Peaceful shrine set within a forested park.',
        visitDurationMin: 60,
        openingHours: '05:00 - 18:00',
      },
    ],
    legs: [
      { mode: 'train', durationMin: 20, distanceKm: 8.5 },
      { mode: 'walk', durationMin: 25, distanceKm: 2.1 },
    ],
  },
  costEstimate: {
    flightTotal: 1900,
    hotelTotal: 1715,
    foodTotal: 600,
    activitiesTotal: 300,
    localTransportTotal: 180,
    grandTotal: 4495,
    currency: 'USD',
    days: 7,
    travelers: 2,
    breakdown: [
      { label: 'Flights', amount: 1900, currency: 'USD' },
      { label: 'Hotel', amount: 1715, currency: 'USD' },
      { label: 'Food', amount: 600, currency: 'USD' },
      { label: 'Activities', amount: 300, currency: 'USD' },
      { label: 'Transport', amount: 180, currency: 'USD' },
    ],
  },
};

const bookedFlight: SelectedFlight = {
  departure: {
    id: 'fl-1',
    airline: { code: 'JL', name: 'Japan Airlines' },
    flightNumber: 'JL005',
    origin: 'SFO',
    destination: 'HND',
    departureTime: '2026-10-08T12:00:00Z',
    arrivalTime: '2026-10-09T16:00:00Z',
    durationMinutes: 660,
    price: 950,
    currency: 'USD',
    seatsAvailable: 8,
    stops: 1,
  },
  return: {
    id: 'fl-2',
    airline: { code: 'JL', name: 'Japan Airlines' },
    flightNumber: 'JL006',
    origin: 'HND',
    destination: 'SFO',
    departureTime: '2026-10-11T12:00:00Z',
    arrivalTime: '2026-10-11T16:00:00Z',
    durationMinutes: 660,
    price: 950,
    currency: 'USD',
    seatsAvailable: 8,
    stops: 1,
  },
};

const bookedHotel: HotelAvailability = sampleData.suggestedHotel as HotelAvailability;

export const Default: Story = {
  args: {
    data: sampleData,
  },
};

export const WithBookedItems: Story = {
  args: {
    data: sampleData,
    bookedFlight,
    bookedHotel,
  },
};
