import AsyncStorage from '@react-native-async-storage/async-storage';

import { render, screen, userEvent } from '@testing-library/react-native';

import { ThemeToggleButton } from '../ThemeToggleButton';
import { ThemeProvider } from '../../../theme';

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

test('renders an accessible toggle button', async () => {
  await render(
    <ThemeProvider>
      <ThemeToggleButton />
    </ThemeProvider>
  );

  expect(screen.getByLabelText('Toggle theme')).toBeOnTheScreen();
});

test('toggles from the default dark theme to light when pressed', async () => {
  const user = userEvent.setup();

  await render(
    <ThemeProvider>
      <ThemeToggleButton />
    </ThemeProvider>
  );

  await user.press(screen.getByLabelText('Toggle theme'));

  expect(AsyncStorage.setItem).toHaveBeenCalledWith('mobile-ui-theme', 'light');
});

test('toggles back to dark on a second press', async () => {
  const user = userEvent.setup();

  await render(
    <ThemeProvider>
      <ThemeToggleButton />
    </ThemeProvider>
  );

  const button = screen.getByLabelText('Toggle theme');

  await user.press(button);
  await user.press(button);

  expect(AsyncStorage.setItem).toHaveBeenLastCalledWith('mobile-ui-theme', 'dark');
});
