import type { Meta, StoryObj } from '@storybook/react';

import { ChatInput } from './index';

const meta: Meta<typeof ChatInput> = {
  title: 'Chat/ChatInput',
  component: ChatInput,
  tags: ['autodocs'],
  argTypes: {
    isStreaming: { control: 'boolean', description: 'Disable input while AI responds' },
    placeholder: { control: 'text' },
  },
  args: {
    onSend: () => {},
    isStreaming: false,
    placeholder: 'Ask me anything about your trip…',
  },
};

export default meta;
type Story = StoryObj<typeof ChatInput>;

export const Default: Story = {};

export const Streaming: Story = {
  name: 'Streaming (disabled)',
  args: { isStreaming: true },
};

export const CustomPlaceholder: Story = {
  name: 'Custom placeholder',
  args: { placeholder: 'Where would you like to go?' },
};
