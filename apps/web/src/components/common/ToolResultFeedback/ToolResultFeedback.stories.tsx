import type { Meta, StoryObj } from '@storybook/react';

import { ToolEmptyCard, ToolErrorCard, ToolInvalidResultCard } from './index';

const meta: Meta<typeof ToolInvalidResultCard> = {
  title: 'Common/ToolResultFeedback',
  component: ToolInvalidResultCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ToolInvalidResultCard>;

export const InvalidResult: Story = {
  name: 'Invalid result — generic',
  args: { message: 'Received an unexpected result.' },
};

export const InvalidRoute: Story = {
  name: 'Invalid result — route',
  args: { message: 'Received an unexpected route result.' },
};

export const InvalidPlaces: Story = {
  name: 'Invalid result — places',
  args: { message: 'Received an unexpected places result.' },
};

export const InvalidLocalTips: Story = {
  name: 'Invalid result — local tips',
  args: { message: 'Received an unexpected local tips result.' },
};

export const InvalidTripSummary: Story = {
  name: 'Invalid result — trip summary',
  args: { message: 'Received an unexpected trip summary result.' },
};

export const InvalidWeather: Story = {
  name: 'Invalid result — weather',
  args: { message: 'Received an unexpected weather result.' },
};

export const InvalidDestinationExplorer: Story = {
  name: 'Invalid result — destination explorer',
  args: { message: 'Received an unexpected destination explorer result.' },
};

export const InvalidHotel: Story = {
  name: 'Invalid result — hotel',
  args: { message: 'Received an unexpected hotel result.' },
};

export const InvalidFlight: Story = {
  name: 'Invalid result — flight',
  args: { message: 'Received an unexpected flight result.' },
};

export const Empty: Story = {
  name: 'Empty result',
  render: () => <ToolEmptyCard message="No flights matched this search." />,
};

export const RetryableError: Story = {
  name: 'Tool error (retryable)',
  render: () => (
    <ToolErrorCard
      result={{ error: 'Provider unavailable', code: 'PROVIDER_UNAVAILABLE', retryable: true }}
    />
  ),
};

export const NonRetryableError: Story = {
  name: 'Tool error (non-retryable)',
  render: () => <ToolErrorCard result={{ error: 'Something went wrong.' }} />,
};
