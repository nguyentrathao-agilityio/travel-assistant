import { renderHook } from '@testing-library/react-native';

import { AGENT_NAME } from '@repo/constants';

import { MAX_VISIBLE_SUGGESTIONS } from '../../constants';
import { useChatSuggestions } from '../useChatSuggestions';

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

test('configures dynamic suggestions that start after the first message', async () => {
  await renderHook(() => useChatSuggestions());

  const [config, deps] = mockUseConfigureSuggestions.mock.calls[0];

  expect(config.available).toBe('after-first-message');
  expect(config.maxSuggestions).toBe(MAX_VISIBLE_SUGGESTIONS);
  // CopilotKit reloads suggestions itself when a run ends; extra deps would trigger duplicate runs.
  expect(deps).toBeUndefined();
});

test('pins the provider/consumer agent to AGENT_NAME so the engine does not look up "default"', async () => {
  await renderHook(() => useChatSuggestions());

  const [config] = mockUseConfigureSuggestions.mock.calls[0];

  expect(config.providerAgentId).toBe(AGENT_NAME);
  expect(config.consumerAgentId).toBe(AGENT_NAME);
});

test('keeps instructions free of trip state so mid-run state updates never re-trigger suggestions', async () => {
  await renderHook(() => useChatSuggestions());

  const [config] = mockUseConfigureSuggestions.mock.calls[0];

  expect(config.instructions).not.toMatch(/destination is|already selected|trip state \(/);
});

test('keeps an identical config across re-renders so no extra reload is requested', async () => {
  const { rerender } = await renderHook(() => useChatSuggestions());

  await rerender({});

  const [first, second] = mockUseConfigureSuggestions.mock.calls.map(([config]) => config);

  expect(first).not.toBeNull();
  expect(JSON.stringify(second)).toBe(JSON.stringify(first));
});

test('reads suggestions back from useSuggestions scoped to the travel agent', async () => {
  const suggestions = [{ isLoading: false, message: 'Show hotels', title: 'Find hotels' }];

  mockUseSuggestions.mockReturnValue({
    clearSuggestions: jest.fn(),
    isLoading: true,
    reloadSuggestions: jest.fn(),
    suggestions,
  });

  const { result } = await renderHook(() => useChatSuggestions());

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

  const { result } = await renderHook(() => useChatSuggestions());

  expect(result.current.suggestions).toHaveLength(MAX_VISIBLE_SUGGESTIONS);
  expect(result.current.suggestions).toEqual(suggestions.slice(0, MAX_VISIBLE_SUGGESTIONS));
});
