import type { Meta, StoryObj } from '@storybook/react';

import { ErrorCard } from './index';

const meta: Meta<typeof ErrorCard> = {
  title: 'Common/ErrorCard',
  component: ErrorCard,
  tags: ['autodocs'],
  argTypes: {
    message: { control: 'text', description: 'Error message to display' },
  },
  args: {
    message: 'Something went wrong. Please try again.',
  },
};

export default meta;
type Story = StoryObj<typeof ErrorCard>;

export const Default: Story = {
  args: {
    message: 'Something went wrong. Please try again.',
  },
};

export const CustomMessage: Story = {
  name: 'Custom message',
  args: {
    message: 'Failed to load flights. Please check your internet connection.',
  },
};

export const LongMessage: Story = {
  name: 'Long message',
  args: {
    message:
      'Unable to complete your booking at this time. This could be due to a network error, invalid payment information, or system maintenance. Please try again later.',
  },
};
