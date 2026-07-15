import type { Meta, StoryObj } from '@storybook/react';

import { CustomUserMessage } from './index';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof CustomUserMessage> = {
  title: 'Chat/CustomUserMessage',
  component: CustomUserMessage,
  tags: ['autodocs'],
  argTypes: {},
  args: {
    message: {
      id: 'user-1',
      role: 'user',
      content: 'I would like to travel to Kyoto next spring. Any recommendations?',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CustomUserMessage>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
};

export const LongText: Story = {
  name: 'Long text',
  args: {
    message: {
      id: 'user-2',
      role: 'user',
      content:
        'I have 10 days for my trip and want a mix of culture, food, and beaches. I prefer mid-range hotels and public transport. Can you propose an itinerary?',
    },
  },
};
