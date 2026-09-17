import { Text } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { MessageBubble } from '../MessageBubble';
import { ThemeProvider } from '../../theme';

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
      <MessageBubble allMessages={allMessages} message={message as never} />
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
