import type { Meta, StoryObj } from '@storybook/react';
import { TypingIndicator } from '.';

const meta: Meta<typeof TypingIndicator> = {
  title: 'Chat/TypingIndicator',
  component: TypingIndicator,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'Accessible label and visible text' },
    className: { control: 'text', description: 'Additional CSS classes' },
  },
  args: {
    label: 'AI is thinking…',
  },
};

export default meta;
type Story = StoryObj<typeof TypingIndicator>;

export const Default: Story = {};

export const PlanningTrip: Story = {
  name: 'Planning trip',
  args: { label: 'Planning your trip…' },
};

export const SearchingFlights: Story = {
  name: 'Searching flights',
  args: { label: 'Searching for flights…' },
};
