import type { Meta, StoryObj } from '@storybook/react';

import { StepBadge } from './index';

const meta: Meta<typeof StepBadge> = {
  title: 'Common/StepBadge',
  component: StepBadge,
  tags: ['autodocs'],
  argTypes: {
    index: {
      control: { type: 'number' },
      description: 'Step number to display',
    },
  },
  args: {
    index: 1,
  },
};

export default meta;
type Story = StoryObj<typeof StepBadge>;

export const StepOne: Story = {
  args: { index: 1 },
};

export const StepTwo: Story = {
  args: { index: 2 },
};

export const StepThree: Story = {
  args: { index: 3 },
};

export const StepTen: Story = {
  args: { index: 10 },
};

export const AllSteps: Story = {
  name: 'Steps 1-5',
  render: () => (
    <div className="flex gap-3">
      {[1, 2, 3, 4, 5].map((step) => (
        <StepBadge key={step} index={step} />
      ))}
    </div>
  ),
};
