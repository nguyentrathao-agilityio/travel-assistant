import type { Meta, StoryObj } from '@storybook/react';

import { Badge, type BadgeVariant } from './index';

const meta: Meta<typeof Badge> = {
  title: 'Common/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'primary', 'warning', 'secondary', 'accent', 'danger'] as BadgeVariant[],
      description: 'Badge color variant',
    },
    label: { control: 'text', description: 'Badge text label' },
    showIcon: { control: 'boolean', description: 'Show icon associated with variant' },
  },
  args: {
    variant: 'primary',
    label: 'Badge',
    showIcon: true,
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Success: Story = {
  args: { variant: 'success', label: 'Success' },
};

export const Primary: Story = {
  args: { variant: 'primary', label: 'Primary' },
};

export const Warning: Story = {
  args: { variant: 'warning', label: 'Warning' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', label: 'Secondary' },
};

export const Accent: Story = {
  args: { variant: 'accent', label: 'Accent' },
};

export const Danger: Story = {
  args: { variant: 'danger', label: 'Danger' },
};

export const WithoutIcon: Story = {
  name: 'Without icon',
  args: { variant: 'primary', label: 'No icon', showIcon: false },
};

export const AllVariants: Story = {
  name: 'All variants',
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="success" label="Success" />
      <Badge variant="primary" label="Primary" />
      <Badge variant="warning" label="Warning" />
      <Badge variant="secondary" label="Secondary" />
      <Badge variant="accent" label="Accent" />
      <Badge variant="danger" label="Danger" />
    </div>
  ),
};
