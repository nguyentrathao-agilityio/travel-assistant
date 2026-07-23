import { render, screen } from '@testing-library/react';
import { useCopilotChatInternal } from '@copilotkit/react-core';
import { TravelChat } from '../TravelChat';

jest.mock('@/stores', () => ({
  useThreadStore: jest.fn((selector: (s: object) => unknown) =>
    selector({ activeThreadId: 'thread-1', isResumed: false, threads: [] })
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
  useInjectThreadHistory: jest.fn().mockReturnValue({ isLoading: false, error: null }),
  useBookingInfo: jest.fn(),
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
