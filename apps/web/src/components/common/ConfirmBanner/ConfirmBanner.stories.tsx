import type { Meta, StoryObj } from '@storybook/react';

import { ConfirmBanner } from './index';

const meta: Meta<typeof ConfirmBanner> = {
  title: 'Common/ConfirmBanner',
  component: ConfirmBanner,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text', description: 'Success title' },
    description: { control: 'text', description: 'Confirmation details' },
    price: { control: 'text', description: 'Optional price display' },
    onChangeClick: { action: 'change' },
    onConfirmClick: { action: 'confirm' },
  },
  args: {
    title: 'Hotel booked',
    description: 'Mandarin Oriental, Bangkok',
    onChangeClick: () => {},
    onConfirmClick: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmBanner>;

export const Default: Story = {
  args: {
    title: 'Flight booked',
    description: 'Bangkok (BKK) → Tokyo (NRT)',
  },
};

export const WithPrice: Story = {
  name: 'With price',
  args: {
    title: 'Hotel booked',
    description: 'Mandarin Oriental, Bangkok',
    price: '$350/night',
  },
};

export const LongDescription: Story = {
  name: 'Long description',
  args: {
    title: 'Trip confirmed',
    description:
      'Your entire trip has been booked successfully. All confirmations have been sent to your email.',
    price: '$2,450',
  },
};
