import type { Meta, StoryObj } from '@storybook/react';

import { ChatEmptyState } from './index';

const meta: Meta<typeof ChatEmptyState> = {
  title: 'Chat/ChatEmptyState',
  component: ChatEmptyState,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onSuggestionClick: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ChatEmptyState>;

export const Default: Story = {};
