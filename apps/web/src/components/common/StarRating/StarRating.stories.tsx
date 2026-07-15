import type { Meta, StoryObj } from '@storybook/react';

import { StarRating } from './index';

const meta: Meta<typeof StarRating> = {
  title: 'Common/StarRating',
  component: StarRating,
  tags: ['autodocs'],
  argTypes: {
    count: {
      control: { type: 'range', min: 0, max: 5, step: 1 },
      description: 'Number of filled stars (0-5)',
    },
  },
  args: {
    count: 5,
  },
};

export default meta;
type Story = StoryObj<typeof StarRating>;

export const OneStar: Story = {
  args: { count: 1 },
};

export const TwoStars: Story = {
  args: { count: 2 },
};

export const ThreeStars: Story = {
  args: { count: 3 },
};

export const FourStars: Story = {
  args: { count: 4 },
};

export const FiveStars: Story = {
  args: { count: 5 },
};

export const NoStars: Story = {
  name: 'No stars',
  args: { count: 0 },
};

export const AllRatings: Story = {
  name: 'All ratings',
  render: () => (
    <div className="flex flex-col gap-4">
      {[0, 1, 2, 3, 4, 5].map((count) => (
        <div key={count} className="flex items-center gap-4">
          <span className="text-body font-regular text-text-secondary w-12">
            {count} star{count !== 1 ? 's' : ''}
          </span>
          <StarRating count={count} />
        </div>
      ))}
    </div>
  ),
};
