import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '../index';

const mockFetchThreads = jest.fn().mockResolvedValue(undefined);
const mockFetchMoreThreads = jest.fn().mockResolvedValue(undefined);
const mockCreateThread = jest.fn().mockResolvedValue(undefined);
const mockDeleteThread = jest.fn().mockResolvedValue(undefined);
const mockSelectThread = jest.fn();

let mockIsLoadingMore = false;
let mockHasMoreThreads = false;

jest.mock('@/stores', () => ({
  useThreadStore: (selector: (s: object) => unknown) =>
    selector({
      activeThreadId: 'thread-1',
      threads: [
        { id: 'thread-1', title: 'Trip to Da Nang', createdAt: new Date().toISOString() },
        { id: 'thread-2', title: 'Bangkok trip', createdAt: new Date().toISOString() },
      ],
      isLoading: false,
      get isLoadingMore() {
        return mockIsLoadingMore;
      },
      get hasMoreThreads() {
        return mockHasMoreThreads;
      },
      isCreating: false,
      fetchThreads: mockFetchThreads,
      fetchMoreThreads: mockFetchMoreThreads,
      createThread: mockCreateThread,
      deleteThread: mockDeleteThread,
      selectThread: mockSelectThread,
    }),
}));

jest.mock('zustand/shallow', () => ({ useShallow: (fn: unknown) => fn }));

jest.mock('../ThreadItem', () => ({
  ThreadItem: ({
    id,
    title,
    onDelete,
  }: {
    id: string;
    title: string | null;
    onDelete: (id: string) => void;
  }) => (
    <div data-testid="thread-item" data-id={id}>
      <span>{title}</span>
      <button onClick={() => onDelete(id)}>Delete</button>
    </div>
  ),
}));

jest.mock('../CollapsedThreadButton', () => ({
  CollapsedThreadButton: ({ id }: { id: string }) => (
    <div data-testid="collapsed-thread-button" data-id={id} />
  ),
}));

beforeEach(() => {
  mockFetchThreads.mockClear();
  mockFetchMoreThreads.mockClear();
  mockCreateThread.mockClear();
  mockDeleteThread.mockClear();
  mockSelectThread.mockClear();
  mockIsLoadingMore = false;
  mockHasMoreThreads = false;
});

describe('Sidebar', () => {
  describe('rendering', () => {
    it('fetches threads on mount', () => {
      render(<Sidebar />);
      expect(mockFetchThreads).toHaveBeenCalledTimes(1);
    });

    it('renders thread items for each thread', () => {
      render(<Sidebar />);
      expect(screen.getAllByTestId('thread-item')).toHaveLength(2);
    });

    it('renders thread titles', () => {
      render(<Sidebar />);
      expect(screen.getByText('Trip to Da Nang')).toBeInTheDocument();
      expect(screen.getByText('Bangkok trip')).toBeInTheDocument();
    });

    it('renders the "New conversation" button', () => {
      render(<Sidebar />);
      expect(screen.getByRole('button', { name: /new conversation/i })).toBeInTheDocument();
    });
  });

  describe('collapse / expand', () => {
    it('collapses the sidebar when the collapse button is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      await user.click(screen.getByLabelText('Collapse sidebar'));
      expect(screen.queryAllByTestId('thread-item')).toHaveLength(0);
      expect(screen.getAllByTestId('collapsed-thread-button')).toHaveLength(2);
    });

    it('expands the sidebar when the brand icon is clicked in collapsed state', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      await user.click(screen.getByLabelText('Collapse sidebar'));
      await user.click(screen.getByLabelText('Expand sidebar'));
      expect(screen.getAllByTestId('thread-item')).toHaveLength(2);
    });
  });

  describe('new conversation', () => {
    it('calls createThread when the "New conversation" button is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      await user.click(screen.getByRole('button', { name: /new conversation/i }));
      expect(mockCreateThread).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete thread — confirmation modal', () => {
    it('shows the confirmation modal when a delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      await user.click(screen.getAllByRole('button', { name: /delete/i })[0]);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText(/delete conversation/i)).toBeInTheDocument();
    });

    it('does NOT call deleteThread until confirmed', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      await user.click(screen.getAllByRole('button', { name: /delete/i })[0]);
      expect(mockDeleteThread).not.toHaveBeenCalled();
    });

    it('calls deleteThread with correct id after confirming', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      await user.click(screen.getAllByRole('button', { name: /delete/i })[0]);
      const dialog = screen.getByRole('alertdialog');
      await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));
      expect(mockDeleteThread).toHaveBeenCalledWith('thread-1');
    });

    it('closes the modal and does NOT delete on cancel', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      await user.click(screen.getAllByRole('button', { name: /delete/i })[0]);
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockDeleteThread).not.toHaveBeenCalled();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('closes the modal on Escape key', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      await user.click(screen.getAllByRole('button', { name: /delete/i })[0]);
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(mockDeleteThread).not.toHaveBeenCalled();
    });

    it('shows the thread title in the modal', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      await user.click(screen.getAllByRole('button', { name: /delete/i })[0]);
      const dialog = screen.getByRole('alertdialog');
      expect(within(dialog).getByText(/trip to da nang/i)).toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    // Real IntersectionObserver requires actual layout, which jsdom doesn't do — mock it so
    // tests can simulate the sentinel becoming visible directly, including the "list is too
    // short to scroll" case (the sentinel is visible immediately, with no scroll gesture).
    class MockIntersectionObserver {
      static instances: MockIntersectionObserver[] = [];
      callback: IntersectionObserverCallback;
      observe = jest.fn();
      unobserve = jest.fn();
      disconnect = jest.fn();
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        MockIntersectionObserver.instances.push(this);
      }
      trigger(isIntersecting: boolean) {
        this.callback([{ isIntersecting } as IntersectionObserverEntry], this as never);
      }
    }

    beforeEach(() => {
      MockIntersectionObserver.instances = [];
      global.IntersectionObserver =
        MockIntersectionObserver as unknown as typeof IntersectionObserver;
    });

    it('fetches more threads as soon as the sentinel is visible, even with no scrolling', () => {
      mockHasMoreThreads = true;
      render(<Sidebar />);
      const [observer] = MockIntersectionObserver.instances;
      observer.trigger(true);
      expect(mockFetchMoreThreads).toHaveBeenCalledTimes(1);
    });

    it('does not fetch when the sentinel is not visible', () => {
      mockHasMoreThreads = true;
      render(<Sidebar />);
      const [observer] = MockIntersectionObserver.instances;
      observer.trigger(false);
      expect(mockFetchMoreThreads).not.toHaveBeenCalled();
    });

    it('does not observe anything when there is nothing more to load', () => {
      mockHasMoreThreads = false;
      render(<Sidebar />);
      expect(screen.queryByTestId('load-more-sentinel')).not.toBeInTheDocument();
      expect(MockIntersectionObserver.instances).toHaveLength(0);
    });

    it('stops observing once a search query becomes active', async () => {
      mockHasMoreThreads = true;
      const user = userEvent.setup();
      render(<Sidebar />);
      const [observer] = MockIntersectionObserver.instances;

      await user.type(screen.getByPlaceholderText('Search...'), 'Tokyo');

      expect(observer.disconnect).toHaveBeenCalled();
      expect(MockIntersectionObserver.instances).toHaveLength(1);
    });

    it('shows a loading indicator while fetching more threads', () => {
      mockIsLoadingMore = true;
      render(<Sidebar />);
      expect(
        screen.getByRole('status', { name: /loading more conversations/i })
      ).toBeInTheDocument();
    });
  });
});
