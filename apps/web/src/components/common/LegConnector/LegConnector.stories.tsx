import type { Meta, StoryObj } from '@storybook/react';

import { LegConnector } from './index';
import type { TravelLeg } from '@repo/types';

const meta: Meta<typeof LegConnector> = {
  title: 'Common/LegConnector',
  component: LegConnector,
  tags: ['autodocs'],
  argTypes: {
    leg: {
      description: 'Travel leg with transport type and duration',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LegConnector>;

const mockLeg: TravelLeg = {
  transport: 'flight',
  durationMin: 120,
  distanceKm: 800,
};

const mockDurationFormatter = (min: number) => {
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

export const Flight: Story = {
  args: {
    leg: { transport: 'flight', durationMin: 120, distanceKm: 800 },
    formatDuration: mockDurationFormatter,
  },
};

export const Train: Story = {
  args: {
    leg: { transport: 'train', durationMin: 240, distanceKm: 400 },
    formatDuration: mockDurationFormatter,
  },
};

export const Taxi: Story = {
  args: {
    leg: { transport: 'taxi', durationMin: 180, distanceKm: 300 },
    formatDuration: mockDurationFormatter,
  },
};

export const Bus: Story = {
  args: {
    leg: { transport: 'bus', durationMin: 360, distanceKm: 500 },
    formatDuration: mockDurationFormatter,
  },
};

export const WithoutDistance: Story = {
  name: 'Without distance',
  args: {
    leg: { transport: 'flight', durationMin: 120, distanceKm: 0 },
    formatDuration: mockDurationFormatter,
  },
};

export const AllTransports: Story = {
  name: 'All transport types',
  render: () => {
    const transports: TravelLeg['transport'][] = ['flight', 'train', 'taxi', 'bus'];
    return (
      <div className="flex flex-col gap-2">
        {transports.map((transport) => (
          <LegConnector
            key={transport}
            leg={{
              transport,
              durationMin: Math.floor(Math.random() * 360) + 30,
              distanceKm: Math.floor(Math.random() * 1000) + 50,
            }}
            formatDuration={mockDurationFormatter}
          />
        ))}
      </div>
    );
  },
};
