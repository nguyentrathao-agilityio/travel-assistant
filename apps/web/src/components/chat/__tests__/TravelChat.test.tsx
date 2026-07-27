import { render, screen } from '@testing-library/react';
import { useCopilotChatInternal } from '@copilotkit/react-core';
import { TravelChat } from '../TravelChat';

jest.mock('@/stores', () => ({
  useThreadStore: jest.fn((selector: (s: object) => unknown) =>
    selector({ activeThreadId: 'thread-1', isResumed: false, threads: [] })
  ),
  useConversationRendererStore: jest.fn((selector: (s: object) => unknown) =>
    selector({
      setThreadHistory: jest.fn(),
      setSendMessage: jest.fn(),
      threadId: 'thread-1',
      persistedMessages: [],
      isHistoryLoading: false,
      sendMessage: null,
    })
  ),
}));

jest.mock('zustand/shallow', () => ({ useShallow: (fn: unknown) => fn }));

jest.mock('@/hooks', () => ({
  useTitleSync: jest.fn(),
  useWeatherAction: jest.fn(),
  useRouteAction: jest.fn(),
  useFlightAction: jest.fn(),
  usePlacesAction: jest.fn(),
  useLocalTipsAction: jest.fn(),
  useHotelAction: jest.fn(),
  useTripSummaryAction: jest.fn(),
  useDestinationExplorerAction: jest.fn(),
  useThreadHistory: jest.fn().mockReturnValue({ messages: [], isLoading: false, error: null }),
  useSeedAgentHistory: jest.fn(),
  useConversationMessages: jest.fn((_persisted, live) => live),
  useBookingInfo: jest.fn(),
  useBookingAction: jest.fn(),
  useBookedActions: jest.fn(),
  useThemeAction: jest.fn(),
  useTripState: jest.fn().mockReturnValue({ state: {} }),
}));

beforeEach(() => {
  jest
    .mocked(useCopilotChatInternal)
    .mockReturnValue({ messages: [] } as unknown as ReturnType<typeof useCopilotChatInternal>);
});

describe('TravelChat', () => {
  describe('rendering', () => {
    it('renders the "Travel Assistant" heading', () => {
      render(<TravelChat />);
      expect(screen.getByRole('heading', { name: 'Travel Assistant' })).toBeInTheDocument();
    });
    it('renders the CopilotChat component', () => {
      const { CopilotChat } = jest.requireMock('@copilotkit/react-ui');
      render(<TravelChat />);
      expect(CopilotChat).toHaveBeenCalled();
    });
  });

  describe('hooks', () => {
    it('mounts without errors when all action hooks are registered', () => {
      expect(() => render(<TravelChat />)).not.toThrow();
    });
  });
});
