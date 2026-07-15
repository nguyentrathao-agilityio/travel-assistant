import type { Meta, StoryObj } from '@storybook/react';

import { Divider } from './index';

const meta: Meta<typeof Divider> = {
  title: 'Common/Divider',
  component: Divider,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Layout axis of the divider',
    },
    children: {
      control: 'text',
      description: 'Optional label centred inside a horizontal divider',
    },
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
  decorators: [
    (StoryFn) => (
      <div className="w-80 p-4">
        <StoryFn />
      </div>
    ),
  ],
};

export const Vertical: Story = {
  args: { orientation: 'vertical' },
  decorators: [
    (StoryFn) => (
      <div className="flex h-10 items-center gap-2 p-4">
        <span className="text-body font-regular text-text-secondary">Left</span>
        <StoryFn />
        <span className="text-body font-regular text-text-secondary">Right</span>
      </div>
    ),
  ],
};

export const WithLabel: Story = {
  name: 'With label',
  args: { orientation: 'horizontal', children: 'or' },
  decorators: [
    (StoryFn) => (
      <div className="w-80 p-4">
        <StoryFn />
      </div>
    ),
  ],
};

export const AllVariants: Story = {
  name: 'All variants',
  render: () => (
    <div className="flex w-80 flex-col gap-6 p-4">
      <div className="flex flex-col gap-2">
        <p className="text-label text-text-tertiary font-medium uppercase tracking-widest">
          Horizontal
        </p>
        <Divider />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-label text-text-tertiary font-medium uppercase tracking-widest">
          With label
        </p>
        <Divider>or</Divider>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-label text-text-tertiary font-medium uppercase tracking-widest">
          Vertical
        </p>
        <div className="flex h-8 items-center gap-2">
          <span className="text-body font-regular text-text-secondary">Left</span>
          <Divider orientation="vertical" />
          <span className="text-body font-regular text-text-secondary">Right</span>
        </div>
      </div>
    </div>
  ),
};
