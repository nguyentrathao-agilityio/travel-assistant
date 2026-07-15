import type { Meta, StoryObj } from '@storybook/react';

import { useThreadStore } from '@/stores';
import { Sidebar } from './index';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const today = new Date().toISOString();
const yesterday = new Date(Date.now() - 86_400_000).toISOString();
const older = new Date(Date.now() - 86_400_000 * 5).toISOString();

const MOCK_THREADS = [
  { id: 'thread-1', title: 'Trip to Tokyo', createdAt: today },
  { id: 'thread-2', title: 'Bangkok weekend escape', createdAt: today },
  { id: 'thread-3', title: 'Da Nang beach holiday', createdAt: yesterday },
  { id: 'thread-4', title: 'Vietnam highlights tour', createdAt: older },
];

const mockActions = {
  setActiveThreadId: () => {},
  setThreads: () => {},
  updateThread: () => {},
  fetchThreads: () => Promise.resolve(undefined),
  createThread: () => Promise.resolve(undefined),
  deleteThread: () => Promise.resolve(undefined),
  selectThread: () => {},
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Sidebar> = {
  title: 'Chat/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="flex h-screen">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const WithThreads: Story = {
  name: 'With threads',
  beforeEach() {
    useThreadStore.setState(
      {
        activeThreadId: 'thread-1',
        isResumed: false,
        threads: MOCK_THREADS,
        isLoading: false,
        isCreating: false,
        ...mockActions,
      },
      true
    );
  },
};

export const Empty: Story = {
  name: 'Empty (no threads)',
  beforeEach() {
    useThreadStore.setState(
      {
        activeThreadId: 'thread-new',
        isResumed: false,
        threads: [],
        isLoading: false,
        isCreating: false,
        ...mockActions,
      },
      true
    );
  },
};

export const Loading: Story = {
  name: 'Loading threads',
  beforeEach() {
    useThreadStore.setState(
      {
        activeThreadId: 'thread-1',
        isResumed: false,
        threads: [],
        isLoading: true,
        isCreating: false,
        ...mockActions,
      },
      true
    );
  },
};

export const Creating: Story = {
  name: 'Creating new thread',
  beforeEach() {
    useThreadStore.setState(
      {
        activeThreadId: 'thread-1',
        isResumed: false,
        threads: MOCK_THREADS,
        isLoading: false,
        isCreating: true,
        ...mockActions,
      },
      true
    );
  },
};
