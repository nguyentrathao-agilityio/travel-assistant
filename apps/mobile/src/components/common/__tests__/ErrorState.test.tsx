import { render, screen, userEvent } from '@testing-library/react-native';

import { ErrorState } from '../ErrorState';
import { ThemeProvider } from '../../../theme';

test('renders the default message when none is provided', async () => {
  await render(
    <ThemeProvider>
      <ErrorState />
    </ThemeProvider>
  );

  expect(screen.getByText('Something went wrong. Please try again.')).toBeOnTheScreen();
});

test('renders a custom message', async () => {
  await render(
    <ThemeProvider>
      <ErrorState message="Flights are unavailable" />
    </ThemeProvider>
  );

  expect(screen.getByText('Flights are unavailable')).toBeOnTheScreen();
});

test('exposes the message row as an alert', async () => {
  await render(
    <ThemeProvider>
      <ErrorState message="Flights are unavailable" />
    </ThemeProvider>
  );

  expect(screen.getByText('⚠️').parent).toHaveProp('accessibilityRole', 'alert');
});

test('omits the retry button when onRetry is not provided', async () => {
  await render(
    <ThemeProvider>
      <ErrorState />
    </ThemeProvider>
  );

  expect(screen.queryByRole('button')).not.toBeOnTheScreen();
});

test('fires onRetry when the retry button is pressed', async () => {
  const user = userEvent.setup();
  const onRetry = jest.fn();

  await render(
    <ThemeProvider>
      <ErrorState onRetry={onRetry} retryLabel="Try again" />
    </ThemeProvider>
  );

  const retryButton = screen.getByRole('button', { name: 'Try again' });

  await user.press(retryButton);

  expect(onRetry).toHaveBeenCalledTimes(1);
});
