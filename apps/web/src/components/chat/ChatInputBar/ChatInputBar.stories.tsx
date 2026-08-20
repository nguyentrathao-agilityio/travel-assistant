import type { Meta, StoryObj } from '@storybook/react';
import { CopilotKit } from '@copilotkit/react-core/v2';

import { ChatInputBar } from './index';
import { Message } from '@copilotkit/react-core/v2';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ChatInputBar> = {
  title: 'Chat/ChatInputBar',
  component: ChatInputBar,
  tags: ['autodocs'],
  argTypes: {
    onSend: { action: 'send' },
    inProgress: {
      control: 'boolean',
      description: 'Disable input while agent is running',
    },
  },
  args: {
    onSend: async (text: string): Promise<Message> => {
      return {
        id: 'mock-message-id',
        role: 'user',
        content: text,
      };
    },
    inProgress: false,
  },
  decorators: [
    (Story) => (
      <CopilotKit
        publicLicenseKey="demo"
        runtimeUrl="http://localhost:8000"
        agent="agent"
        threadId="demo"
      >
        <div className="flex h-screen flex-col justify-end">
          <Story />
        </div>
      </CopilotKit>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatInputBar>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  args: {
    inProgress: false,
  },
};

export const InProgress: Story = {
  name: 'In Progress (disabled)',
  args: {
    inProgress: true,
  },
};
