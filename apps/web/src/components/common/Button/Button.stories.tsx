import type { Meta, StoryObj } from '@storybook/react';
import { Heart, ChevronRight } from 'lucide-react';

import { Button } from './index';
import type { ButtonVariant, ButtonSize } from '@/constants/button';

const meta: Meta<typeof Button> = {
  title: 'Common/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'success'] as ButtonVariant[],
      description: 'Button style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'] as ButtonSize[],
      description: 'Button size',
    },
    children: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    children: 'Button',
    onClick: () => {},
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary', size: 'md', children: 'Primary' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', size: 'md', children: 'Secondary' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', size: 'md', children: 'Ghost' },
};

export const Danger: Story = {
  args: { variant: 'danger', size: 'md', children: 'Delete' },
};

export const Small: Story = {
  name: 'Size: Small',
  args: { variant: 'primary', size: 'sm', children: 'Small button' },
};

export const Medium: Story = {
  name: 'Size: Medium',
  args: { variant: 'primary', size: 'md', children: 'Medium button' },
};

export const Large: Story = {
  name: 'Size: Large',
  args: { variant: 'primary', size: 'lg', children: 'Large button' },
};

export const WithLeftIcon: Story = {
  name: 'With left icon',
  args: {
    variant: 'primary',
    size: 'md',
    leftIcon: <Heart size={16} />,
    children: 'Favorite',
  },
};

export const WithRightIcon: Story = {
  name: 'With right icon',
  args: {
    variant: 'primary',
    size: 'md',
    rightIcon: <ChevronRight size={16} />,
    children: 'Next',
  },
};

export const Disabled: Story = {
  args: { variant: 'primary', size: 'md', children: 'Disabled', disabled: true },
};

export const AllVariants: Story = {
  name: 'All variants',
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};
