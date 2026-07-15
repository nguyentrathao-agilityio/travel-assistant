import type { Meta, StoryObj } from '@storybook/react';

import { FlightContextForm } from './index';
import { FLIGHT_REQUIRED_FIELDS, FLIGHT_OPTIONAL_FIELDS } from '@/constants';

const meta: Meta<typeof FlightContextForm> = {
  title: 'Components/FlightContextForm',
  component: FlightContextForm,
  tags: ['autodocs'],
  argTypes: {
    onConfirm: { action: 'confirm' },
    onCancel: { action: 'cancel' },
  },
};

export default meta;
type Story = StoryObj<typeof FlightContextForm>;

// Empty args: required fields missing -> form renders required inputs
export const Default: Story = {
  args: {
    args: {},
    onConfirm: () => {},
    onCancel: () => {},
  },
};

// Pre-filled required fields: only optional origin remains
export const PreFilled: Story = {
  args: {
    args: {
      destination: 'LAX',
      departure_date: '2026-06-15',
    },
    onConfirm: () => {},
    onCancel: () => {},
  },
};

// Disabled state: component should render nothing
export const Disabled: Story = {
  args: {
    args: {},
    disabled: true,
    onConfirm: () => {},
    onCancel: () => {},
  },
};

// With initial values filled in the inputs
export const WithInitialValues: Story = {
  args: {
    args: {},
    initialValues: {
      origin: 'NYC',
      adults: '2',
    },
    onConfirm: () => {},
    onCancel: () => {},
  },
};
