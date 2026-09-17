import { Linking } from 'react-native';

import { render, screen, userEvent } from '@testing-library/react-native';

import { ApiKeyScreen } from '../ApiKeyScreen';
import { ThemeProvider } from '../../theme';

const renderScreen = async (props: Partial<Parameters<typeof ApiKeyScreen>[0]> = {}) => {
  const onSubmit = jest.fn();

  await render(
    <ThemeProvider>
      <ApiKeyScreen error={null} isVerifying={false} onSubmit={onSubmit} {...props} />
    </ThemeProvider>
  );

  return { onSubmit };
};

test('renders the title and description', async () => {
  await renderScreen();

  expect(screen.getByText('OpenAI API key')).toBeOnTheScreen();
});

test('continue is disabled until a key is entered', async () => {
  await renderScreen();

  expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
});

test('submitting a typed key calls onSubmit with the trimmed value', async () => {
  const user = userEvent.setup();
  const { onSubmit } = await renderScreen();

  await user.type(screen.getByPlaceholderText('sk-…'), 'sk-abc123');
  await user.press(screen.getByRole('button', { name: 'Continue' }));

  expect(onSubmit).toHaveBeenCalledWith('sk-abc123');
});

test('shows the verifying label and disables input while verifying', async () => {
  await renderScreen({ isVerifying: true });

  expect(screen.getByText('Verifying…')).toBeOnTheScreen();
  expect(screen.getByPlaceholderText('sk-…')).toBeDisabled();
});

test('shows an error message when provided', async () => {
  await renderScreen({ error: 'Incorrect API key provided' });

  expect(screen.getByText('Incorrect API key provided')).toBeOnTheScreen();
});

test('toggling show/hide switches the label', async () => {
  const user = userEvent.setup();
  await renderScreen();

  expect(screen.getByText('Show')).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Show API key' }));

  expect(screen.getByText('Hide')).toBeOnTheScreen();
});

test('pressing the OpenAI link opens the keys URL', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
  const user = userEvent.setup();
  await renderScreen();

  await user.press(screen.getByRole('link'));

  expect(openURL).toHaveBeenCalledWith(expect.stringContaining('openai.com'));
});
