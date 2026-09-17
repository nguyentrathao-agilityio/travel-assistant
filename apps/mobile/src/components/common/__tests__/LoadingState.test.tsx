import { render, screen } from '@testing-library/react-native';

import { LoadingState } from '../LoadingState';
import { ThemeProvider } from '../../../theme';

test('renders an accessible progress indicator', async () => {
  await render(
    <ThemeProvider>
      <LoadingState />
    </ThemeProvider>
  );

  const progress = screen.getByLabelText('Loading');

  expect(progress).toBeOnTheScreen();
  expect(progress).toHaveProp('accessibilityRole', 'progressbar');
});

test('renders the default number of skeleton lines', async () => {
  await render(
    <ThemeProvider>
      <LoadingState />
    </ThemeProvider>
  );

  const progress = screen.getByLabelText('Loading');

  expect(progress.children).toHaveLength(4);
});

test('renders a custom number of skeleton lines', async () => {
  await render(
    <ThemeProvider>
      <LoadingState lines={1} />
    </ThemeProvider>
  );

  const progress = screen.getByLabelText('Loading');

  expect(progress.children).toHaveLength(2);
});
