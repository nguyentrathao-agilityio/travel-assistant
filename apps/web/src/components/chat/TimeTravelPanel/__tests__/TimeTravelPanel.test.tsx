import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { TimeTravelPanel } from '../index';
import { langgraphClient } from '@/lib';

const mockRefreshActiveThread = jest.fn();

jest.mock('@/stores', () => ({
  useThreadStore: (selector: (state: object) => unknown) =>
    selector({ activeThreadId: 'thread-1', refreshActiveThread: mockRefreshActiveThread }),
}));

jest.mock('@/lib', () => ({
  langgraphClient: {
    threads: { getHistory: jest.fn() },
    runs: { wait: jest.fn() },
  },
}));

const checkpoint = {
  values: {
    messages: [{ id: 'human-1', type: 'human', content: 'Plan a trip to Kyoto' }],
  },
  next: ['classify'],
  checkpoint: { thread_id: 'thread-1', checkpoint_id: 'checkpoint-1', checkpoint_ns: '' },
  parent_checkpoint: null,
  metadata: { step: 2, writes: { plan: {} } },
  created_at: '2026-08-03T08:00:00.000Z',
  tasks: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(langgraphClient.threads.getHistory).mockResolvedValue([checkpoint] as never);
  jest.mocked(langgraphClient.runs.wait).mockResolvedValue({} as never);
});

describe('TimeTravelPanel', () => {
  it('loads and displays checkpoint history', async () => {
    render(<TimeTravelPanel open onClose={jest.fn()} />);

    expect(await screen.findAllByText(/human: Plan a trip to Kyoto/)).toHaveLength(2);
    expect(langgraphClient.threads.getHistory).toHaveBeenCalledWith('thread-1', { limit: 50 });
    expect(screen.getByText('Writes: plan · Next: classify')).toBeInTheDocument();
  });

  it('replays from the selected checkpoint without new input', async () => {
    const onClose = jest.fn();
    render(<TimeTravelPanel open onClose={onClose} />);

    fireEvent.click(await screen.findByRole('button', { name: /Replay execution/i }));

    await waitFor(() =>
      expect(langgraphClient.runs.wait).toHaveBeenCalledWith('thread-1', 'travel', {
        checkpointId: 'checkpoint-1',
        input: null,
        multitaskStrategy: 'reject',
      })
    );
    expect(mockRefreshActiveThread).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('forks an alternative itinerary from the selected checkpoint', async () => {
    render(<TimeTravelPanel open onClose={jest.fn()} />);

    fireEvent.change(await screen.findByLabelText(/Explore an alternative/i), {
      target: { value: 'Make it budget friendly' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create alternative branch/i }));

    await waitFor(() =>
      expect(langgraphClient.runs.wait).toHaveBeenCalledWith('thread-1', 'travel', {
        checkpointId: 'checkpoint-1',
        input: {
          messages: [{ type: 'human', content: 'Make it budget friendly' }],
        },
        multitaskStrategy: 'reject',
      })
    );
  });
});
