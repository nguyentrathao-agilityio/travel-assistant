import type { Meta, StoryObj } from '@storybook/react';

import { HotelContextForm } from './index';

const meta: Meta<typeof HotelContextForm> = {
  title: 'Components/HotelContextForm',
  component: HotelContextForm,
  tags: ['autodocs'],
  argTypes: {
    onConfirm: { action: 'confirm' },
    onCancel: { action: 'cancel' },
  },
};

export default meta;
type Story = StoryObj<typeof HotelContextForm>;

export const Default: Story = {
  args: {
    args: {},
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const WithPartialArgs: Story = {
  args: {
    args: {
      city: 'Tokyo',
      check_in: '2026-08-01',
    },
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const WithInitialValues: Story = {
  args: {
    args: {},
    initialValues: {
      city: 'Tokyo',
      guests: '2',
    },
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const Disabled: Story = {
  args: {
    args: {
      city: 'Tokyo',
      check_in: '2026-08-01',
      check_out: '2026-08-05',
    },
    disabled: true,
    onConfirm: () => {},
    onCancel: () => {},
  },
};
