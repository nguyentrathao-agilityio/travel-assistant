import type { Meta, StoryObj } from '@storybook/react';

import { StopCard } from './index';
import type { LandmarkStop, TravelLeg } from '@repo/types';

const meta: Meta<typeof StopCard> = {
  title: 'Components/StopCard',
  component: StopCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StopCard>;

const sampleStop: LandmarkStop = {
  name: 'Old Town Square',
  city: 'Prague',
  description: 'A historic square with colorful architecture and street performers.',
  visitDurationMin: 45,
  openingHours: '08:00 - 22:00',
  entranceFee: 0,
  lat: 50.0875,
  lng: 14.4213,
};

const nextLeg: TravelLeg = {
  transport: 'walk',
  durationMin: 12,
  distanceKm: 0.8,
};

export const Default: Story = {
  args: {
    stop: sampleStop,
    index: 1,
    formatDuration: (min) => `${min} min`,
  },
};

export const WithNextLeg: Story = {
  args: {
    stop: sampleStop,
    index: 1,
    nextLeg,
    formatDuration: (min) => `${min} min`,
  },
};

export const WithLocalTips: Story = {
  args: {
    stop: sampleStop,
    index: 1,
    formatDuration: (min) => `${min} min`,
    tipsState: {
      tips: [
        {
          id: 'tip-1',
          category: 'culture',
          scope: 'city',
          title: 'Quiet hours in residential areas',
          content: 'Keep noise to a minimum after 10 PM to respect locals.',
          isEssential: true,
        },
      ],
      onOpen: () => {},
    },
  },
};
