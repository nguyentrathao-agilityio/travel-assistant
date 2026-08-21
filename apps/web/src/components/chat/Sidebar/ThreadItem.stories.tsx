import type { Meta, StoryObj } from '@storybook/react';

import { ThreadItem } from './ThreadItem';

const meta: Meta<typeof ThreadItem> = {
  title: 'Chat/Sidebar/ThreadItem',
  component: ThreadItem,
  tags: ['autodocs'],
  argTypes: {
    isActive: { control: 'boolean' },
    title: { control: 'text' },
  },
  args: {
    id: 'thread-1',
    title: 'Trip to Tokyo',
    isActive: false,
    onSelect: () => {},
    onReset: () => {},
    onDelete: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ThreadItem>;

export const Default: Story = {};

export const Active: Story = {
  args: { isActive: true },
};

export const Untitled: Story = {
  name: 'Untitled thread',
  args: { title: null },
};
