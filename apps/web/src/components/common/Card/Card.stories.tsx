import type { Meta, StoryObj } from '@storybook/react';

import { Card } from './index';

const meta: Meta<typeof Card> = {
  title: 'Common/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    isSelected: { control: 'boolean', description: 'Apply selected styling' },
    onClick: { action: 'click' },
  },
  args: {
    isSelected: false,
    onClick: () => {},
    children: 'Card content',
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    isSelected: false,
    children: 'Default card content',
  },
};

export const Selected: Story = {
  args: {
    isSelected: true,
    children: 'Selected card content',
  },
};

export const Interactive: Story = {
  name: 'Interactive (clickable)',
  args: {
    onClick: () => {},
    children: 'Click me to select',
  },
};

export const AllStates: Story = {
  name: 'All states',
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-label text-text-tertiary mb-2 font-medium uppercase tracking-widest shadow">
          Default
        </p>
        <Card>Default card</Card>
      </div>
      <div>
        <p className="text-label text-text-tertiary mb-2 font-medium uppercase tracking-widest shadow">
          Selected
        </p>
        <Card isSelected>Selected card</Card>
      </div>
      <div>
        <p className="text-label text-text-tertiary mb-2 font-medium uppercase tracking-widest shadow">
          Clickable
        </p>
        <Card onClick={() => {}}>Clickable card</Card>
      </div>
    </div>
  ),
};
