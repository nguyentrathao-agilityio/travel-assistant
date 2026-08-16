import type { Meta, StoryObj } from '@storybook/react';

import { DestinationExplorerCard } from './index';
import type { DestinationExplorerResult } from '@repo/schemas';

const meta: Meta<typeof DestinationExplorerCard> = {
  title: 'Components/DestinationExplorerCard',
  component: DestinationExplorerCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DestinationExplorerCard>;

const sampleData: DestinationExplorerResult = {
  city: 'Da Nang',
  weather: {
    location: {
      name: 'Da Nang',
      country: 'Vietnam',
      latitude: 16.0678,
      longitude: 108.2208,
      timezone: 'Asia/Ho_Chi_Minh',
    },
    current: {
      time: '2026-08-16T08:00:00Z',
      temperatureC: 30,
      apparentTemperatureC: 33,
      relativeHumidity: 74,
      windSpeedKmh: 10,
      weatherCode: 1000,
      description: 'Sunny',
    },
    daily: [
      {
        date: '2026-08-16',
        tempMinC: 26,
        tempMaxC: 32,
        precipitationProbabilityMax: 15,
        description: 'Sunny with light breeze',
      },
    ],
    attribution: 'Weather data provided by OpenWeather',
    travelTip: 'Bring sunscreen and stay hydrated during the day.',
  },
  places: {
    total: 2,
    city: 'Da Nang',
    category: 'attraction',
    results: [
      {
        id: 'place-1',
        shortCode: 'MB',
        name: 'Marble Mountains',
        city: 'Da Nang',
        country: 'Vietnam',
        category: 'attraction',
        description: 'A cluster of marble hills with caves and pagodas.',
        address: '1 Huyen Tran Cong Chua',
        rating: 4.5,
        reviewCount: 1500,
        priceLevel: 1,
        imageUrl: '',
        tags: ['nature'],
        isRecommended: true,
      },
      {
        id: 'place-2',
        shortCode: 'DB',
        name: 'Dragon Bridge',
        city: 'Da Nang',
        country: 'Vietnam',
        category: 'attraction',
        description: 'Iconic bridge that breathes fire on weekend nights.',
        address: 'Nguyen Van Linh',
        rating: 4.6,
        reviewCount: 2200,
        priceLevel: 0,
        imageUrl: '',
        tags: ['landmark'],
        isRecommended: true,
      },
    ],
  },
  tips: {
    city: 'Da Nang',
    country: 'Vietnam',
    count: 1,
    summary: 'Key tips for first-time visitors.',
    tips: [
      {
        id: 'tip-1',
        category: 'transport',
        scope: 'city',
        title: 'Grab is the easiest way to get around',
        content: 'Ride-hailing apps are cheap, reliable, and widely used in Da Nang.',
        isEssential: true,
        location: null,
      },
    ],
  },
};

export const Default: Story = {
  args: {
    data: sampleData,
  },
};

export const WeatherOnly: Story = {
  name: 'Weather only',
  args: {
    data: { ...sampleData, places: null, tips: null },
  },
};
