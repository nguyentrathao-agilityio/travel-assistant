import type { Meta, StoryObj } from '@storybook/react';

import { CustomAssistantMessage } from './index';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof CustomAssistantMessage> = {
  title: 'Chat/CustomAssistantMessage',
  component: CustomAssistantMessage,
  tags: ['autodocs'],
  argTypes: {
    onCopy: { action: 'copy' },
    onRegenerate: { action: 'regenerate' },
    onThumbsUp: { action: 'thumbsUp' },
    onThumbsDown: { action: 'thumbsDown' },
    feedback: { control: 'text' },
  },
  args: {
    isLoading: false,
    isCurrentMessage: false,
    feedback: undefined,
    message: {
      id: 'assistant-1',
      role: 'assistant',
      content:
        'Hello! I can help you plan your trip. Ask me anything about destinations, hotels, or flights.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CustomAssistantMessage>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
};

export const Loading: Story = {
  name: 'Loading (typing)',
  args: {
    isLoading: true,
    message: undefined,
  },
};

export const WithGenerativeUIBefore: Story = {
  name: 'With generative UI (before)',
  args: {
    message: {
      id: 'assistant-2',
      role: 'assistant',
      content: 'Here is a suggestion with extra UI above the message.',
      generativeUI: () => <div className="rounded bg-slate-100 p-2">Generative UI (before)</div>,
      generativeUIPosition: 'before',
    },
  },
};

export const WithGenerativeUIAfter: Story = {
  name: 'With generative UI (after)',
  args: {
    message: {
      id: 'assistant-3',
      role: 'assistant',
      content: 'This message includes an action UI below the bubble.',
      generativeUI: () => <div className="rounded bg-slate-100 p-2">Generative UI (after)</div>,
      generativeUIPosition: 'after',
    },
  },
};
