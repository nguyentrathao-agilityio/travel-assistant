import type { Meta, StoryObj } from '@storybook/react';

import { LoadingCard } from './index';

const meta: Meta<typeof LoadingCard> = {
  title: 'Common/LoadingCard',
  component: LoadingCard,
  tags: ['autodocs'],
  argTypes: {
    lines: {
      control: 'number',
      description: 'Number of skeleton lines to show',
    },
    showFooter: {
      control: 'boolean',
      description: 'Show footer skeleton area',
    },
    showBadge: {
      control: 'boolean',
      description: 'Show badge skeleton in header',
    },
  },
  args: {
    lines: 3,
    showFooter: true,
    showBadge: true,
  },
};

export default meta;
type Story = StoryObj<typeof LoadingCard>;

export const Default: Story = {
  args: {
    lines: 3,
    showFooter: true,
    showBadge: true,
  },
};

export const Minimal: Story = {
  args: {
    lines: 2,
    showFooter: false,
    showBadge: false,
  },
};

export const WithFooter: Story = {
  name: 'With footer',
  args: {
    lines: 3,
    showFooter: true,
    showBadge: true,
  },
};

export const WithoutBadge: Story = {
  name: 'Without badge',
  args: {
    lines: 3,
    showFooter: true,
    showBadge: false,
  },
};

export const LongContent: Story = {
  name: 'Long content',
  args: {
    lines: 5,
    showFooter: true,
    showBadge: true,
  },
};
