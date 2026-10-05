import { Linking, Text } from 'react-native';

import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';

import { MessageBubble } from '../MessageBubble';
import { MessagePlaybackProvider } from '../chat/MessagePlaybackContext';
import { ThemeProvider } from '../../theme';
import { buildToolMessageIndex } from '../../utils/chatMessages';

import type { Message } from '@copilotkit/react-native/headless';

const mockRenderToolCall = jest.fn();

jest.mock('@copilotkit/react-native/headless', () => ({
  useRenderToolCall: () => mockRenderToolCall,
}));

beforeEach(() => {
  mockRenderToolCall.mockReset();
  mockRenderToolCall.mockReturnValue(null);
});

const renderBubble = async (message: Message, allMessages: Message[] = [message]) => {
  await render(
    <ThemeProvider>
      <MessageBubble
        message={message as never}
        toolMessageIndex={buildToolMessageIndex(allMessages)}
      />
    </ThemeProvider>
  );
};

test('renders a user message', async () => {
  const message = { id: '1', role: 'user', content: 'Plan a trip to Hue' } as unknown as Message;

  await renderBubble(message);

  expect(screen.getByText('Plan a trip to Hue')).toBeOnTheScreen();
});

test('renders an assistant message with text content', async () => {
  const message = {
    id: '1',
    role: 'assistant',
    content: 'Here is your plan',
  } as unknown as Message;

  await renderBubble(message);

  expect(screen.getByText('Here is your plan')).toBeOnTheScreen();
});

test('opens a Markdown web link when pressed', async () => {
  const openUrlSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  const user = userEvent.setup();
  const message = {
    id: '1',
    role: 'assistant',
    content: 'Apply on the [Vietnam e-Visa website](https://evisa.gov.vn).',
  } as unknown as Message;

  await renderBubble(message);
  await user.press(screen.getByRole('link', { name: 'Vietnam e-Visa website' }));

  expect(openUrlSpy).toHaveBeenCalledWith('https://evisa.gov.vn');
  openUrlSpy.mockRestore();
});

test('does not make an unsafe Markdown URL interactive', async () => {
  const message = {
    id: '1',
    role: 'assistant',
    content: '[Run this](javascript:alert(1))',
  } as unknown as Message;

  await renderBubble(message);

  expect(screen.queryByRole('link', { name: 'Run this' })).not.toBeOnTheScreen();
  expect(screen.getByText('[Run this](javascript:alert(1))')).toBeOnTheScreen();
});

test('shows the thinking indicator when the assistant has no text or tool calls yet', async () => {
  const message = { id: '1', role: 'assistant', content: '' } as unknown as Message;

  await renderBubble(message);

  expect(screen.getByLabelText('AI is responding')).toBeOnTheScreen();
});

test('renders the fallback for a tool call with no matching renderer', async () => {
  const message = {
    id: '1',
    role: 'assistant',
    content: '',
    toolCalls: [{ id: 'call-1', function: { name: 'searchFlights' } }],
  } as unknown as Message;

  await renderBubble(message);

  expect(screen.getByText('Using searchFlights…')).toBeOnTheScreen();
});

test('renders the custom tool call output when a renderer is registered', async () => {
  mockRenderToolCall.mockReturnValue(<Text>Flight results ready</Text>);

  const message = {
    id: '1',
    role: 'assistant',
    content: '',
    toolCalls: [{ id: 'call-1', function: { name: 'searchFlights' } }],
  } as unknown as Message;

  await renderBubble(message);

  expect(screen.getByText('Flight results ready')).toBeOnTheScreen();
  expect(screen.queryByText('Using searchFlights…')).not.toBeOnTheScreen();
});

const playbackValue = () => ({
  loadingId: null as string | null,
  playRecording: jest.fn(),
  playingId: null as string | null,
  recordings: new Map([['u1', 4200]]) as ReadonlyMap<string, number>,
  speakReply: jest.fn(),
  stop: jest.fn(),
});

test('shows a replay button on a recorded user message and on assistant text', async () => {
  const playback = playbackValue();
  const messages = [
    { id: 'u1', role: 'user', content: 'Hi' },
    { id: 'a1', role: 'assistant', content: 'Hello!' },
    { id: 'u2', role: 'user', content: 'Typed' },
  ] as unknown as Message[];

  await render(
    <ThemeProvider>
      <MessagePlaybackProvider value={playback}>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message as never}
            toolMessageIndex={buildToolMessageIndex(messages)}
          />
        ))}
      </MessagePlaybackProvider>
    </ThemeProvider>
  );

  await fireEvent.press(screen.getByTestId('play-u1'));
  await fireEvent.press(screen.getByTestId('play-a1'));

  expect(playback.playRecording).toHaveBeenCalledWith('u1');
  expect(playback.speakReply).toHaveBeenCalledWith('a1', 'Hello!');
  expect(screen.queryByTestId('play-u2')).toBeNull();
  expect(screen.getByText('0:05')).toBeOnTheScreen();
});

test('shows a spinner while a recording is loading', async () => {
  const playback = { ...playbackValue(), loadingId: 'u1', playingId: 'u1' };
  const message = { id: 'u1', role: 'user', content: 'Hi' } as unknown as Message;

  await render(
    <ThemeProvider>
      <MessagePlaybackProvider value={playback}>
        <MessageBubble
          message={message as never}
          toolMessageIndex={buildToolMessageIndex([message])}
        />
      </MessagePlaybackProvider>
    </ThemeProvider>
  );

  expect(screen.getByTestId('play-u1-loading')).toBeOnTheScreen();
});

test('renders no replay buttons without a playback provider', async () => {
  await renderBubble({ id: 'a1', role: 'assistant', content: 'Hello!' } as unknown as Message);

  expect(screen.queryByTestId('play-a1')).toBeNull();
});
