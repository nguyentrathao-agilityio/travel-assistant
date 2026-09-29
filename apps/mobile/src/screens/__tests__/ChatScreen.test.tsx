import { Text } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { act, render, screen, userEvent } from '@testing-library/react-native';

import { ChatScreen } from '../ChatScreen';
import { ThemeProvider } from '../../theme';
import { SAFE_AREA_INITIAL_METRICS } from '../../test/fixtures';

import type { ChatVoiceProps } from '../../hooks';
import type { OlderHistoryProps } from '../../components/chat/ChatMessageList';
import type { Message } from '@copilotkit/react-native/headless';
import type { ReactElement } from 'react';

const mockRenderToolCall = jest.fn();

jest.mock('@copilotkit/react-native/headless', () => ({
  useRenderToolCall: () => mockRenderToolCall,
}));

jest.mock('react-native-reanimated', () => {
  const { useRef } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');

  const interpolate = (value: number, input: [number, number], output: [number, number]) => {
    const [inMin, inMax] = input;
    const [outMin, outMax] = output;
    const clamped = Math.min(Math.max(value, inMin), inMax);
    const ratio = inMax === inMin ? 0 : (clamped - inMin) / (inMax - inMin);

    return outMin + ratio * (outMax - outMin);
  };

  return {
    __esModule: true,
    default: { View },
    Extrapolation: { CLAMP: 'clamp' },
    interpolate,
    useAnimatedStyle: (fn: () => unknown) => fn(),
    useDerivedValue: (fn: () => unknown) =>
      useRef({
        get value() {
          return fn();
        },
      }).current,
    useSharedValue: (initial: unknown) => useRef({ value: initial }).current,
    withRepeat: (animation: unknown) => animation,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    withTiming: (toValue: unknown) => toValue,
  };
});

const baseVoice: ChatVoiceProps = {
  dictatedTranscript: null,
  isVoiceModeActive: false,
  micLevel: { value: 0 } as ChatVoiceProps['micLevel'],
  onExitVoiceMode: jest.fn(),
  onStartListening: jest.fn(),
  onStartVoiceMode: jest.fn(),
  onStopListening: jest.fn(),
  onStopSpeaking: jest.fn(),
  onStopVoiceModeTurn: jest.fn(),
  partialTranscript: '',
  voiceErrorMessage: null,
  voiceState: 'idle',
};

const baseHistory: OlderHistoryProps = {
  hasNewer: false,
  hasOlder: false,
  isLoadingOlder: false,
  olderError: null,
  onLoadNewer: jest.fn(),
  onLoadOlder: jest.fn(),
  onRetryOlder: jest.fn(),
};

const baseProps: Parameters<typeof ChatScreen>[0] = {
  threadId: 'thread-1',
  error: null,
  history: baseHistory,
  interruptElement: null as ReactElement | null,
  isReady: true,
  isRunning: false,
  messages: [] as Message[],
  onBack: jest.fn(),
  onSend: jest.fn(),
  onStop: jest.fn(),
  suggestions: [],
  voice: baseVoice,
};

const renderScreen = async (
  props: Partial<Omit<Parameters<typeof ChatScreen>[0], 'voice' | 'history'>> & {
    voice?: Partial<ChatVoiceProps>;
    history?: Partial<OlderHistoryProps>;
  } = {}
) => {
  const { voice: voiceOverrides, history: historyOverrides, ...rest } = props;
  const merged = {
    ...baseProps,
    ...rest,
    voice: { ...baseVoice, ...voiceOverrides },
    history: { ...baseHistory, ...historyOverrides },
  };

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

test('shows the empty state when history contains only non-renderable tool messages', async () => {
  const messages = [
    { id: 'tool-1', role: 'tool', content: '{}', toolCallId: 'call-1' },
  ] as unknown as Message[];

  await renderScreen({ messages });

  expect(screen.getByText('Where to next?')).toBeOnTheScreen();
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

test('pressing a suggestion dismisses the keyboard', async () => {
  const user = userEvent.setup();
  await renderScreen({ messages: [] });

  await user.press(screen.getByText('Hanoi'));

  expect(KeyboardController.dismiss).toHaveBeenCalledTimes(1);
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

test('remounts the message list when opening another thread', async () => {
  const firstMessages = [
    { id: '1', role: 'user', content: 'First thread' },
  ] as unknown as Message[];
  const secondMessages = [
    { id: '2', role: 'assistant', content: 'Newest message in second thread' },
  ] as unknown as Message[];
  const tree = (threadId: string, messages: Message[]) => (
    <SafeAreaProvider initialMetrics={SAFE_AREA_INITIAL_METRICS}>
      <ThemeProvider>
        <ChatScreen {...baseProps} messages={messages} threadId={threadId} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
  const { rerender } = await render(tree('thread-1', firstMessages));
  const firstList = screen.getByTestId('chat-message-list');

  await rerender(tree('thread-2', secondMessages));

  expect(screen.getByTestId('chat-message-list')).not.toBe(firstList);
});

test('shows older-history loading at the top without hiding current messages', async () => {
  await renderScreen({
    messages: [{ id: 'm20', role: 'user', content: 'Current message' }] as Message[],
    history: { isLoadingOlder: true },
  });

  expect(screen.getByLabelText('Loading older messages')).toBeOnTheScreen();
  expect(screen.getByText('Current message')).toBeOnTheScreen();
});

test('offers a retry at the top when older history fails to load', async () => {
  const user = userEvent.setup();
  const { history } = await renderScreen({
    messages: [{ id: 'm20', role: 'user', content: 'Current message' }] as Message[],
    history: { olderError: 'Could not load older messages.' },
  });

  expect(screen.getByText('Could not load older messages.')).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: 'Retry loading older messages' }));

  expect(history.onRetryOlder).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Current message')).toBeOnTheScreen();
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

test('sending a typed message dismisses the keyboard', async () => {
  const user = userEvent.setup();
  await renderScreen();

  await user.type(screen.getByPlaceholderText('Write here…'), 'Hello there');
  await user.press(screen.getByRole('button', { name: 'Send' }));

  expect(KeyboardController.dismiss).toHaveBeenCalledTimes(1);
});

test('shows a voice mode trigger instead of send while the draft is empty', async () => {
  const user = userEvent.setup();
  const { voice } = await renderScreen();

  expect(screen.queryByRole('button', { name: 'Send' })).not.toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Voice mode' }));

  expect(voice.onStartVoiceMode).toHaveBeenCalledTimes(1);
});

test('typing text swaps the voice mode trigger for send', async () => {
  const user = userEvent.setup();
  await renderScreen();

  await user.type(screen.getByPlaceholderText('Write here…'), 'Hi');

  expect(screen.getByRole('button', { name: 'Send' })).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Voice mode' })).not.toBeOnTheScreen();
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
  await renderScreen({ voice: { voiceState: 'listening' } });

  expect(screen.getByText('Listening…')).toBeOnTheScreen();
});

test('shows the voice error message instead of the status banner', async () => {
  await renderScreen({
    voice: { voiceState: 'error', voiceErrorMessage: 'Microphone permission denied' },
  });

  expect(screen.getByText('Microphone permission denied')).toBeOnTheScreen();
});

test('the voice button is disabled from starting while awaiting approval', async () => {
  await renderScreen({
    messages: [{ id: '1', role: 'user', content: 'Book it' }] as unknown as Message[],
    interruptElement: <Text>Approve</Text>,
  });

  expect(screen.getByLabelText('Ask by voice')).toBeDisabled();
});

test('the voice button is disabled from starting while the agent is running', async () => {
  await renderScreen({ isRunning: true });

  expect(screen.getByLabelText('Ask by voice')).toBeDisabled();
});

test('the voice button is disabled while voice mode is active', async () => {
  await renderScreen({ voice: { isVoiceModeActive: true } });

  expect(screen.getByLabelText('Ask by voice')).toBeDisabled();
});

test('shows the voice mode overlay when active, and exits via X or the keyboard button', async () => {
  const user = userEvent.setup();
  const { voice } = await renderScreen({
    voice: { isVoiceModeActive: true, voiceState: 'listening' },
  });

  expect(screen.getByText('Listening…')).toBeOnTheScreen();

  await user.press(screen.getByLabelText('Exit voice mode'));
  await user.press(screen.getByLabelText('Switch to keyboard'));

  expect(voice.onExitVoiceMode).toHaveBeenCalledTimes(2);
});

test('voice mode overlay shows the live partial transcript over the status label', async () => {
  await renderScreen({
    voice: {
      isVoiceModeActive: true,
      voiceState: 'listening',
      partialTranscript: 'Plan a trip to',
    },
  });

  expect(screen.getByText('Plan a trip to')).toBeOnTheScreen();
  expect(screen.queryByText('Listening…')).toBeNull();
});

test('voice mode overlay: the center mic button is disabled while connecting/thinking', async () => {
  await renderScreen({ voice: { isVoiceModeActive: true, voiceState: 'connecting' } });

  expect(screen.getByLabelText('Voice mode mic')).toBeDisabled();
});

test('voice mode overlay: the center mic button stops the turn while listening', async () => {
  const user = userEvent.setup();
  const { voice } = await renderScreen({
    voice: { isVoiceModeActive: true, voiceState: 'listening' },
  });

  await user.press(screen.getByLabelText('End your turn'));

  expect(voice.onStopVoiceModeTurn).toHaveBeenCalledTimes(1);
});

test('voice mode overlay: the center mic button interrupts playback while speaking', async () => {
  const user = userEvent.setup();
  const { voice } = await renderScreen({
    voice: { isVoiceModeActive: true, voiceState: 'speaking' },
  });

  await user.press(screen.getByLabelText('Interrupt the reply'));

  expect(voice.onStopVoiceModeTurn).toHaveBeenCalledTimes(1);
});

test('a dictated transcript is merged into the draft without being sent', async () => {
  const { onSend } = await renderScreen({
    voice: { dictatedTranscript: { text: 'Plan a trip', id: 1 } },
  });

  expect(screen.getByPlaceholderText('Write here…')).toHaveProp('value', 'Plan a trip');
  expect(onSend).not.toHaveBeenCalled();
});
