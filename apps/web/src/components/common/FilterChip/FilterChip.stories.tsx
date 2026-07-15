import type { Meta, StoryObj } from '@storybook/react';
import { DollarSign, Star, MapPin } from 'lucide-react';

import { FilterChip, type FilterOption } from './index';

const meta: Meta<typeof FilterChip> = {
  title: 'Common/FilterChip',
  component: FilterChip,
  tags: ['autodocs'],
  argTypes: {
    isActive: { control: 'boolean', description: 'Whether chip is selected' },
    onSelect: { action: 'select' },
  },
  args: {
    isActive: false,
    onSelect: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof FilterChip>;

const defaultOption: FilterOption = {
  value: 'budget',
  label: 'Budget friendly',
};

export const Default: Story = {
  args: {
    option: defaultOption,
    isActive: false,
  },
};

export const Active: Story = {
  args: {
    option: defaultOption,
    isActive: true,
  },
};

export const WithIcon: Story = {
  name: 'With icon',
  args: {
    option: {
      value: 'price',
      label: 'Budget',
      icon: DollarSign,
    },
    isActive: false,
  },
};

export const WithCount: Story = {
  name: 'With count',
  args: {
    option: {
      value: 'rating',
      label: 'Top rated',
      icon: Star,
      count: 24,
    },
    isActive: false,
  },
};

export const AllOptions: Story = {
  name: 'All options',
  render: () => {
    const options: FilterOption[] = [
      { value: 'all', label: 'All' },
      { value: 'budget', label: 'Budget', icon: DollarSign },
      { value: 'luxury', label: 'Luxury', count: 12 },
      { value: 'location', label: 'Central', icon: MapPin, count: 8 },
    ];

    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <FilterChip
            key={option.value}
            option={option}
            isActive={option.value === 'budget'}
            onSelect={() => {}}
          />
        ))}
      </div>
    );
  },
};
