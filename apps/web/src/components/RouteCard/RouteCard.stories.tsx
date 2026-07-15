import type { Meta, StoryObj } from '@storybook/react';

import { RouteCard } from './index';
import type { LandmarkTourRoute } from '@repo/types';

const meta: Meta<typeof RouteCard> = {
  title: 'Components/RouteCard',
  component: RouteCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RouteCard>;

const sampleRoute: LandmarkTourRoute = {
  city: 'Paris',
  totalDurationMin: 180,
  stops: [
    {
      name: 'Eiffel Tower',
      city: 'Paris',
      description: 'Iconic landmark with panoramic city views.',
      visitDurationMin: 45,
      openingHours: '09:00 - 23:00',
      entranceFee: 26,
      lat: 48.8584,
      lng: 2.2945,
    },
    {
      name: 'Louvre Museum',
      city: 'Paris',
      description: 'World-famous museum housing the Mona Lisa.',
      visitDurationMin: 90,
      openingHours: '09:00 - 18:00',
      entranceFee: 17,
      lat: 48.8606,
      lng: 2.3376,
    },
    {
      name: 'Notre-Dame Cathedral',
      city: 'Paris',
      description: 'Historic cathedral with Gothic architecture.',
      visitDurationMin: 30,
      openingHours: '08:00 - 18:45',
      entranceFee: 0,
      lat: 48.853,
      lng: 2.3499,
    },
  ],
  legs: [
    { mode: 'walk', durationMin: 15, distanceKm: 1.2 },
    { mode: 'walk', durationMin: 20, distanceKm: 1.8 },
  ],
};

export const Default: Story = {
  args: {
    data: sampleRoute,
  },
};

export const Loading: Story = {
  args: {
    data: sampleRoute,
  },
};

export const Empty: Story = {
  args: {
    data: {
      city: 'Paris',
      totalDurationMin: 0,
      stops: [],
      legs: [],
    },
  },
};
