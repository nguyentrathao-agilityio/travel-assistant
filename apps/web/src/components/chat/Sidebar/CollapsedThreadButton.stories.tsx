import type { Meta, StoryObj } from '@storybook/react';

import { CollapsedThreadButton } from './CollapsedThreadButton';

const meta: Meta<typeof CollapsedThreadButton> = {
  title: 'Chat/Sidebar/CollapsedThreadButton',
  component: CollapsedThreadButton,
  tags: ['autodocs'],
  argTypes: {
    isActive: { control: 'boolean' },
    title: { control: 'text', description: 'Thread title shown as tooltip' },
  },
  args: {
    id: 'thread-1',
    title: 'Trip to Tokyo',
    isActive: false,
    onSelect: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof CollapsedThreadButton>;

export const Default: Story = {};

export const Active: Story = {
  args: { isActive: true },
};
