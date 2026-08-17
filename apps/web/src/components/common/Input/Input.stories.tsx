import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { X } from 'lucide-react';

import { Input } from './index';
import { Button } from '../Button';

const meta: Meta<typeof Input> = {
  title: 'Common/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    onChange: { action: 'change' },
    placeholder: { control: 'text' },
    label: { control: 'text' },
    hint: { control: 'text' },
    isError: { control: 'boolean' },
    disabled: { control: 'boolean' },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search'],
    },
  },
  args: {
    value: '',
    placeholder: 'Enter text...',
    disabled: false,
    isError: false,
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState('');

    return <Input {...args} value={value} onChange={setValue} />;
  },
};

export const WithLabel: Story = {
  name: 'With label',
  render: (args) => {
    const [value, setValue] = useState('');

    return <Input {...args} value={value} onChange={setValue} label="Destination" />;
  },
};

export const WithHint: Story = {
  name: 'With hint text',
  render: (args) => {
    const [value, setValue] = useState('');

    return (
      <Input
        {...args}
        value={value}
        onChange={setValue}
        label="Email"
        hint="We'll never share your email"
      />
    );
  },
};

export const WithError: Story = {
  name: 'With error',
  render: (args) => {
    const [value, setValue] = useState('invalid');

    return (
      <Input
        {...args}
        value={value}
        onChange={setValue}
        label="Email"
        isError={true}
        hint="Please enter a valid email address"
      />
    );
  },
};

export const Disabled: Story = {
  render: (args) => {
    return <Input {...args} value="Disabled input" onChange={() => {}} disabled={true} />;
  },
};

export const Email: Story = {
  name: 'Email input',
  render: (args) => {
    const [value, setValue] = useState('');

    return (
      <Input
        {...args}
        value={value}
        onChange={setValue}
        type="email"
        label="Email"
        placeholder="your@email.com"
      />
    );
  },
};

export const Password: Story = {
  render: (args) => {
    const [value, setValue] = useState('');

    return (
      <Input
        {...args}
        value={value}
        onChange={setValue}
        type="password"
        label="Password"
        placeholder="••••••••"
      />
    );
  },
};

export const WithClearButton: Story = {
  name: 'With clear button',
  render: () => {
    const [value, setValue] = useState('Sample text');

    return (
      <Input
        value={value}
        onChange={setValue}
        label="Search"
        placeholder="Search destinations..."
        rightSlot={
          value && (
            <Button
              variant="ghost"
              onClick={() => setValue('')}
              className="p-1"
              aria-label="Clear input"
            >
              <X size={16} />
            </Button>
          )
        }
      />
    );
  },
};
