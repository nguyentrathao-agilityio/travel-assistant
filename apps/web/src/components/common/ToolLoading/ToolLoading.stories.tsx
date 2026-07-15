import type { Meta, StoryObj } from '@storybook/react';
import { ToolLoading } from '.';

const meta: Meta<typeof ToolLoading> = {
  component: ToolLoading,
  title: 'Common/ToolLoading',
};

export default meta;
type Story = StoryObj<typeof ToolLoading>;

export const Default: Story = {
  args: {
    target: 'flights',
  },
};
