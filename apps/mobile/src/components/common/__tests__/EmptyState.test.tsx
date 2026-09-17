import { render, screen } from '@testing-library/react-native';

import { EmptyState } from '../EmptyState';
import { ThemeProvider } from '../../../theme';

test('renders the message', async () => {
  await render(
    <ThemeProvider>
      <EmptyState message="No trips yet" />
    </ThemeProvider>
  );

  expect(screen.getByText('No trips yet')).toBeOnTheScreen();
});

test('renders the icon when provided', async () => {
  await render(
    <ThemeProvider>
      <EmptyState icon="🧳" message="No trips yet" />
    </ThemeProvider>
  );

  expect(screen.getByText('🧳')).toBeOnTheScreen();
});

test('omits the icon when not provided', async () => {
  await render(
    <ThemeProvider>
      <EmptyState message="No trips yet" />
    </ThemeProvider>
  );

  expect(screen.queryByText('🧳')).not.toBeOnTheScreen();
});
