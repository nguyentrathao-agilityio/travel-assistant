import type { Meta, StoryObj } from '@storybook/react';

import { WeatherCard } from './index';
import type { WeatherResult } from '@repo/types';

const meta: Meta<typeof WeatherCard> = {
  title: 'Components/WeatherCard',
  component: WeatherCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WeatherCard>;

const sampleData: WeatherResult = {
  location: {
    name: 'Lisbon',
    country: 'Portugal',
    latitude: 38.7223,
    longitude: -9.1393,
    timezone: 'Europe/Lisbon',
  },
  current: {
    time: '2026-06-03T08:00:00Z',
    temperatureC: 22,
    apparentTemperatureC: 24,
    relativeHumidity: 68,
    windSpeedKmh: 12,
    weatherCode: 1000,
    description: 'Sunny',
  },
  daily: [
    {
      date: '2026-06-03',
      tempMinC: 18,
      tempMaxC: 26,
      precipitationProbabilityMax: 10,
      description: 'Sunny with light breeze',
    },
    {
      date: '2026-06-04',
      tempMinC: 19,
      tempMaxC: 27,
      precipitationProbabilityMax: 5,
      description: 'Clear skies',
    },
    {
      date: '2026-06-05',
      tempMinC: 18,
      tempMaxC: 25,
      precipitationProbabilityMax: 20,
      description: 'Partly cloudy',
    },
  ],
  attribution: 'Weather data provided by OpenWeather',
  travelTip: 'Pack sunscreen and light layers for the daytime heat.',
};

export const Default: Story = {
  args: {
    data: sampleData,
  },
};

export const Loading: Story = {
  args: {
    data: sampleData,
  },
};

export const NoForecast: Story = {
  args: {
    data: {
      ...sampleData,
      daily: [],
    },
  },
};
