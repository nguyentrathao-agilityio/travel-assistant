import { renderHook } from '@testing-library/react-native';

import { AGENT_NAME } from '@repo/constants';

import { MAX_VISIBLE_SUGGESTIONS } from '../../constants';
import { useChatSuggestions } from '../useChatSuggestions';

import type { TripState } from '@repo/types';

const mockUseConfigureSuggestions = jest.fn();
const mockUseSuggestions = jest.fn();

jest.mock('@copilotkit/react-native/headless', () => ({
  useConfigureSuggestions: (...args: unknown[]) => mockUseConfigureSuggestions(...args),
  useSuggestions: (...args: unknown[]) => mockUseSuggestions(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSuggestions.mockReturnValue({
    clearSuggestions: jest.fn(),
    isLoading: false,
    reloadSuggestions: jest.fn(),
    suggestions: [],
  });
});

test('configures dynamic instructions grounded in the current trip state', async () => {
  const state: TripState = { destination: 'Da Nang' };

  await renderHook(() =>
    useChatSuggestions({ isAwaitingApproval: false, isRunning: false, messageCount: 3, state })
  );

  const [config, deps] = mockUseConfigureSuggestions.mock.calls[0];

  expect(config.instructions).toContain('destination is Da Nang');
  expect(config.available).toBe('after-first-message');
  expect(config.maxSuggestions).toBe(MAX_VISIBLE_SUGGESTIONS);
  expect(deps).toEqual([state, 3, false, false]);
});

test('pins the provider/consumer agent to AGENT_NAME so the engine does not look up "default"', async () => {
  await renderHook(() =>
    useChatSuggestions({ isAwaitingApproval: false, isRunning: false, messageCount: 1, state: {} })
  );

  const [config] = mockUseConfigureSuggestions.mock.calls[0];

  expect(config.providerAgentId).toBe(AGENT_NAME);
  expect(config.consumerAgentId).toBe(AGENT_NAME);
});

test('mentions confirmed flight and hotel selections in the instructions', async () => {
  const state: TripState = {
    destination: 'Da Nang',
    flights: { departure: { id: 'f1' } } as TripState['flights'],
    hotel: { id: 'h1' } as TripState['hotel'],
  };

  await renderHook(() =>
    useChatSuggestions({ isAwaitingApproval: false, isRunning: false, messageCount: 1, state })
  );

  const [config] = mockUseConfigureSuggestions.mock.calls[0];

  expect(config.instructions).toContain('a flight is already selected');
  expect(config.instructions).toContain('a hotel is already selected');
});

test('passes null to skip suggestions while awaiting booking approval', async () => {
  await renderHook(() =>
    useChatSuggestions({ isAwaitingApproval: true, isRunning: false, messageCount: 2, state: {} })
  );

  expect(mockUseConfigureSuggestions).toHaveBeenCalledWith(null, [{}, 2, false, true]);
});

test('passes null to skip suggestions while a turn is still running', async () => {
  await renderHook(() =>
    useChatSuggestions({ isAwaitingApproval: false, isRunning: true, messageCount: 4, state: {} })
  );

  expect(mockUseConfigureSuggestions).toHaveBeenCalledWith(null, [{}, 4, true, false]);
});

test('reads suggestions back from useSuggestions scoped to the travel agent', async () => {
  const suggestions = [{ isLoading: false, message: 'Show hotels', title: 'Find hotels' }];

  mockUseSuggestions.mockReturnValue({
    clearSuggestions: jest.fn(),
    isLoading: true,
    reloadSuggestions: jest.fn(),
    suggestions,
  });

  const { result } = await renderHook(() =>
    useChatSuggestions({ isAwaitingApproval: false, isRunning: false, messageCount: 1, state: {} })
  );

  expect(mockUseSuggestions).toHaveBeenCalledWith({ agentId: AGENT_NAME });
  expect(result.current.suggestions).toEqual(suggestions);
  expect(result.current.isLoading).toBe(true);
});

test('caps rendered suggestions at MAX_VISIBLE_SUGGESTIONS even if more come back', async () => {
  const suggestions = Array.from({ length: MAX_VISIBLE_SUGGESTIONS + 2 }, (_, i) => ({
    isLoading: false,
    message: `Suggestion ${i}`,
    title: `Suggestion ${i}`,
  }));

  mockUseSuggestions.mockReturnValue({
    clearSuggestions: jest.fn(),
    isLoading: false,
    reloadSuggestions: jest.fn(),
    suggestions,
  });

  const { result } = await renderHook(() =>
    useChatSuggestions({ isAwaitingApproval: false, isRunning: false, messageCount: 1, state: {} })
  );

  expect(result.current.suggestions).toHaveLength(MAX_VISIBLE_SUGGESTIONS);
  expect(result.current.suggestions).toEqual(suggestions.slice(0, MAX_VISIBLE_SUGGESTIONS));
});
