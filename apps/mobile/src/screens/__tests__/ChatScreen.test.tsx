import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { act, render, screen, userEvent } from '@testing-library/react-native';

import { ChatScreen } from '../ChatScreen';
import { ThemeProvider } from '../../theme';
import { SAFE_AREA_INITIAL_METRICS } from '../../test/fixtures';

import type { Message } from '@copilotkit/react-native/headless';
import type { ReactElement } from 'react';

const mockRenderToolCall = jest.fn();

jest.mock('@copilotkit/react-native/headless', () => ({
  useRenderToolCall: () => mockRenderToolCall,
}));

// The real package pulls in react-native-worklets' native (JSI) module, which
// isn't linked under Jest. ChatScreen only reads/writes `.value` and calls
// withTiming for a layout-driven padding animation, so a minimal stand-in
// covers everything it actually does with these two APIs.
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initial: unknown) => ({ value: initial }),
  withTiming: (toValue: unknown) => toValue,
}));

const baseProps: Parameters<typeof ChatScreen>[0] = {
  error: null,
  interruptElement: null as ReactElement | null,
  isReady: true,
  isRunning: false,
  messages: [] as Message[],
  onBack: jest.fn(),
  onSend: jest.fn(),
  onStartListening: jest.fn(),
  onStop: jest.fn(),
  onStopListening: jest.fn(),
  onStopSpeaking: jest.fn(),
  voiceErrorMessage: null as string | null,
  voiceState: 'idle' as const,
};

const renderScreen = async (props: Partial<Parameters<typeof ChatScreen>[0]> = {}) => {
  const merged = { ...baseProps, ...props };

  await render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_INITIAL_METRICS}>
      <ThemeProvider>
        <ChatScreen {...merged} />
      </ThemeProvider>
    </SafeAreaProvider>
  );

  return merged;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRenderToolCall.mockReturnValue(null);
});

test('shows a loading state while not ready', async () => {
  await renderScreen({ isReady: false });

  expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
});

test('shows a "taking longer" hint after 8s while still not ready', async () => {
  jest.useFakeTimers();

  await renderScreen({ isReady: false });

  expect(
    screen.queryByText('This is taking longer than usual — check your connection.')
  ).not.toBeOnTheScreen();

  await act(async () => {
    jest.advanceTimersByTime(8000);
  });

  expect(
    screen.getByText('This is taking longer than usual — check your connection.')
  ).toBeOnTheScreen();

  jest.useRealTimers();
});

test('shows the empty-state suggestions when ready with no messages', async () => {
  await renderScreen({ messages: [] });

  expect(screen.getByText('Where to next?')).toBeOnTheScreen();
  expect(screen.getByText('Da Nang')).toBeOnTheScreen();
  expect(screen.getByText('Find flights')).toBeOnTheScreen();
});

test('pressing a destination pill sends a plan-a-trip message', async () => {
  const user = userEvent.setup();
  const { onSend } = await renderScreen({ messages: [] });

  await user.press(screen.getByText('Hanoi'));

  expect(onSend).toHaveBeenCalledWith('Plan a trip to Hanoi');
});

test('pressing a quick action suggestion sends its message', async () => {
  const user = userEvent.setup();
  const { onSend } = await renderScreen({ messages: [] });

  await user.press(screen.getByText('Find hotels'));

  expect(onSend).toHaveBeenCalledWith('Show hotels in Hoi An');
});

test('empty-state suggestions are disabled while awaiting approval', async () => {
  await renderScreen({
    messages: [],
    interruptElement: <Text>Approve</Text>,
  });

  expect(screen.getByRole('button', { name: /Hanoi/ })).toBeDisabled();
});

test('renders message bubbles for the conversation', async () => {
  const messages = [
    { id: '1', role: 'user', content: 'Plan a trip to Hue' },
    { id: '2', role: 'assistant', content: 'Sure, one moment.' },
  ] as unknown as Message[];

  await renderScreen({ messages });

  expect(screen.getByText('Plan a trip to Hue')).toBeOnTheScreen();
  expect(screen.getByText('Sure, one moment.')).toBeOnTheScreen();
});

test('shows the thinking indicator while running with a non-empty last turn', async () => {
  const messages = [
    { id: '1', role: 'user', content: 'Plan a trip to Hue' },
  ] as unknown as Message[];

  await renderScreen({ messages, isRunning: true });

  expect(screen.getByLabelText('AI is responding')).toBeOnTheScreen();
});

test('renders the interrupt element inline with the conversation', async () => {
  const messages = [{ id: '1', role: 'user', content: 'Book it' }] as unknown as Message[];

  await renderScreen({ messages, interruptElement: <Text>Approve this booking</Text> });

  expect(screen.getByText('Approve this booking')).toBeOnTheScreen();
});

test('typing and sending a message clears the draft', async () => {
  const user = userEvent.setup();
  const { onSend } = await renderScreen();

  const input = screen.getByPlaceholderText('Write here…');

  await user.type(input, 'Hello there');
  await user.press(screen.getByRole('button', { name: 'Send' }));

  expect(onSend).toHaveBeenCalledWith('Hello there');
  expect(input).toHaveProp('value', '');
});

test('send is disabled with an empty draft', async () => {
  await renderScreen();

  expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
});

test('shows a stop button instead of send while running, and stops on press', async () => {
  const user = userEvent.setup();
  const { onStop } = await renderScreen({ isRunning: true });

  expect(screen.queryByRole('button', { name: 'Send' })).not.toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Stop' }));

  expect(onStop).toHaveBeenCalledTimes(1);
});

test('shows an error banner', async () => {
  await renderScreen({ error: 'Something went wrong.' });

  expect(screen.getByText('Something went wrong.')).toBeOnTheScreen();
});

test('shows a voice status banner while listening', async () => {
  await renderScreen({ voiceState: 'listening' });

  expect(screen.getByText('Listening…')).toBeOnTheScreen();
});

test('shows the voice error message instead of the status banner', async () => {
  await renderScreen({ voiceState: 'error', voiceErrorMessage: 'Microphone permission denied' });

  expect(screen.getByText('Microphone permission denied')).toBeOnTheScreen();
});

test('the voice button is disabled from starting while awaiting approval', async () => {
  await renderScreen({
    messages: [{ id: '1', role: 'user', content: 'Book it' }] as unknown as Message[],
    interruptElement: <Text>Approve</Text>,
  });

  expect(screen.getByLabelText('Ask by voice')).toBeDisabled();
});
