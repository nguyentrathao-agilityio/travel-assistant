import type { Meta, StoryObj } from '@storybook/react';

import { FlightCard } from './index';
import type { FlightSearchResult } from '@repo/types';

const meta: Meta<typeof FlightCard> = {
  title: 'Components/FlightCard',
  component: FlightCard,
  tags: ['autodocs'],
  argTypes: {
    onSelect: { action: 'select' },
  },
};

export default meta;
type Story = StoryObj<typeof FlightCard>;

const sampleData: FlightSearchResult = {
  count: 2,
  results: [
    {
      id: 'out-1',
      airline: { code: 'AA', name: 'Air Alpha' },
      flightNumber: 'AA100',
      origin: 'NYC',
      destination: 'LAX',
      departureTime: '2026-06-10T09:00:00Z',
      arrivalTime: '2026-06-10T12:00:00Z',
      durationMinutes: 180,
      price: 120,
      currency: 'USD',
      seatsAvailable: 5,
      stops: 0,
    },
    {
      id: 'out-2',
      airline: { code: 'BB', name: 'Beta Air' },
      flightNumber: 'BB200',
      origin: 'NYC',
      destination: 'LAX',
      departureTime: '2026-06-10T14:00:00Z',
      arrivalTime: '2026-06-10T17:30:00Z',
      durationMinutes: 210,
      price: 180,
      currency: 'USD',
      seatsAvailable: 3,
      stops: 1,
    },
  ],
  returnCount: 1,
  returnResults: [
    {
      id: 'ret-1',
      airline: { code: 'AA', name: 'Air Alpha' },
      flightNumber: 'AA101',
      origin: 'LAX',
      destination: 'NYC',
      departureTime: '2026-06-17T10:00:00Z',
      arrivalTime: '2026-06-17T17:00:00Z',
      durationMinutes: 300,
      price: 150,
      currency: 'USD',
      seatsAvailable: 4,
      stops: 0,
    },
  ],
};

export const Default: Story = {
  args: {
    data: sampleData,
    origin: 'NYC',
    destination: 'LAX',
    departureDate: '2026-06-10',
    returnDate: '2026-06-17',
    adults: 1,
    onSelect: () => {},
  },
};

export const Loading: Story = {
  args: {
    data: { count: 0, results: [] },
    origin: 'NYC',
    destination: 'LAX',
  },
};

export const WithReturnSelected: Story = {
  args: {
    data: sampleData,
    origin: 'NYC',
    destination: 'LAX',
    departureDate: '2026-06-10',
    returnDate: '2026-06-17',
    adults: 2,
    onSelect: () => {},
    initialDeparture: sampleData.results[0],
    initialReturn: sampleData.returnResults?.[0] ?? null,
  },
};
