import { render, screen, userEvent } from '@testing-library/react-native';

import { VoiceButton } from '../VoiceButton';
import { ThemeProvider } from '../../theme';

import type { VoiceState } from '../../hooks';

const renderButton = async (
  voiceState: VoiceState,
  overrides: Partial<{
    disabled: boolean;
    onStart: () => void;
    onStopListening: () => void;
    onStopSpeaking: () => void;
  }> = {}
) => {
  const onStart = overrides.onStart ?? jest.fn();
  const onStopListening = overrides.onStopListening ?? jest.fn();
  const onStopSpeaking = overrides.onStopSpeaking ?? jest.fn();

  await render(
    <ThemeProvider>
      <VoiceButton
        disabled={overrides.disabled}
        onStart={onStart}
        onStopListening={onStopListening}
        onStopSpeaking={onStopSpeaking}
        voiceState={voiceState}
      />
    </ThemeProvider>
  );

  return { onStart, onStopListening, onStopSpeaking };
};

test('idle state invites the user to ask by voice and starts on press', async () => {
  const user = userEvent.setup();
  const { onStart } = await renderButton('idle');

  const button = screen.getByLabelText('Ask by voice');

  expect(button).toBeEnabled();
  await user.press(button);
  expect(onStart).toHaveBeenCalledTimes(1);
});

test('listening state stops listening on press', async () => {
  const user = userEvent.setup();
  const { onStopListening } = await renderButton('listening');

  const button = screen.getByLabelText('Stop listening');

  expect(button).toBeEnabled();
  await user.press(button);
  expect(onStopListening).toHaveBeenCalledTimes(1);
});

test('speaking state stops speaking on press', async () => {
  const user = userEvent.setup();
  const { onStopSpeaking } = await renderButton('speaking');

  const button = screen.getByLabelText('Stop speaking');

  expect(button).toBeEnabled();
  await user.press(button);
  expect(onStopSpeaking).toHaveBeenCalledTimes(1);
});

test('connecting state is disabled and does not call onStart', async () => {
  const user = userEvent.setup();
  const { onStart } = await renderButton('connecting');

  const button = screen.getByLabelText('Connecting to voice session');

  expect(button).toBeDisabled();
  await user.press(button);
  expect(onStart).not.toHaveBeenCalled();
});

test('thinking state is disabled', async () => {
  await renderButton('thinking');

  expect(screen.getByLabelText('Waiting for the response')).toBeDisabled();
});

test('error state shows a retry affordance', async () => {
  await renderButton('error');

  expect(screen.getByLabelText('Voice input unavailable, tap to retry')).toBeOnTheScreen();
});

test('is disabled via the disabled prop while idle', async () => {
  await renderButton('idle', { disabled: true });

  expect(screen.getByLabelText('Ask by voice')).toBeDisabled();
});
