import type { Meta, StoryObj } from '@storybook/react';
import { MapPin, Star, DollarSign } from 'lucide-react';

import { FilterBar } from './index';
import type { FilterOption } from '../common/FilterChip';

const meta: Meta<typeof FilterBar> = {
  title: 'Components/FilterBar',
  component: FilterBar,
  tags: ['autodocs'],
  argTypes: {
    onChange: { action: 'change' },
  },
};

export default meta;
type Story = StoryObj<typeof FilterBar>;

const options: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'budget', label: 'Budget', icon: DollarSign },
  { value: 'luxury', label: 'Luxury', count: 12 },
  { value: 'location', label: 'Central', icon: MapPin, count: 8 },
  { value: 'rating', label: 'Top rated', icon: Star, count: 24 },
];

export const Default: Story = {
  args: {
    filters: options,
    activeFilter: 'all',
    onChange: () => {},
  },
};

export const WithActive: Story = {
  args: {
    filters: options,
    activeFilter: 'budget',
    onChange: () => {},
  },
};
